//! Windows-only host policy. Remote pages receive NO IPC capabilities.
use std::{
    path::{Path, PathBuf},
    sync::atomic::{AtomicU64, Ordering},
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::{
    webview::{DownloadEvent, NewWindowResponse},
    AppHandle, Manager, Url, WebviewUrl, WebviewWindowBuilder, Wry,
};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_updater::UpdaterExt;
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

const LOCAL_SHELL: &str = "http://tauri.localhost/windows.html";
const WINDOW_STATE: StateFlags = StateFlags::SIZE
    .union(StateFlags::POSITION)
    .union(StateFlags::MAXIMIZED);

fn is_site(url: &Url) -> bool {
    matches!(url.scheme(), "http" | "https")
        && url.host_str().is_some_and(|host| {
            host == "1lev1.com" || host.ends_with(".1lev1.com")
        })
        && url.username().is_empty()
        && url.password().is_none()
}

fn is_site_blob(url: &Url) -> bool {
    url.scheme() == "blob" && Url::parse(url.path()).is_ok_and(|inner| is_site(&inner))
}

fn is_local(url: &Url) -> bool {
    url.as_str() == "about:blank" || url.as_str() == LOCAL_SHELL
}

fn open_external(app: &AppHandle, url: &Url) {
    // Do not hand arbitrary custom protocols (file:, javascript:, ms-*, etc.)
    // to ShellExecute, even when requested by a compromised remote page.
    if matches!(url.scheme(), "http" | "https" | "mailto" | "tel") {
        if let Err(error) = app.opener().open_url(url.as_str(), None::<&str>) {
            log::warn!("Could not open external link: {error}");
            app.dialog().message("לא הצלחנו לפתוח את הקישור בדפדפן.").title("1לב1").show(|_| {});
        }
    }
}

pub fn configure(builder: tauri::Builder<Wry>) -> tauri::Builder<Wry> {
    // Must be registered first, before a second process opens the WebView profile.
    builder
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_window_state::Builder::default().with_state_flags(WINDOW_STATE).build())
        .plugin(tauri_plugin_opener::Builder::new().open_js_links_on_click(false).build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
}

fn startup_stage(stage: &str) {
    log::info!("startup: {stage}");
    // Preserve the last completed checkpoint even if the UI subsequently hangs.
    log::logger().flush();
}

pub fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_log::{RotationStrategy, Target, TargetKind};
    app.handle().plugin(
        tauri_plugin_log::Builder::new()
            // Host diagnostics only: no WebView/JS forwarding or HTTP trace logs.
            .level(log::LevelFilter::Off)
            .level_for("app_lib", log::LevelFilter::Info)
            .targets([Target::new(TargetKind::LogDir {
                file_name: Some("desktop".into()),
            })])
            .max_file_size(1_000_000)
            .rotation_strategy(RotationStrategy::KeepSome(3))
            .build(),
    )?;
    log::info!("Windows desktop version {} (pid {})", app.package_info().version, std::process::id());
    startup_stage("setup entered; file logging enabled");
    let navigation_app = app.handle().clone();
    let popup_app = app.handle().clone();
    let mut config = app.config().app.windows.iter()
        .find(|window| window.label == "main")
        .ok_or("Missing main window configuration")?.clone();
    // Start blank until the actual WebView2 UA has been read and extended.
    // A hardcoded Chrome UA would drift from the installed evergreen runtime.
    config.url = WebviewUrl::External(Url::parse("about:blank")?);
    startup_stage("creating main window");
    let window = WebviewWindowBuilder::from_config(app, &config)?
        .on_page_load(|_, payload| {
            // Record only a category, never page paths, queries, fragments or cookies.
            let category = if is_local(payload.url()) { "local shell" }
                else if is_site(payload.url()) { "live site" }
                else { "other" };
            log::info!("page load {:?}: {category}", payload.event());
            log::logger().flush();
        })
        .on_navigation(move |url| {
            // This is top-level navigation, NOT an iframe/resource filter.
            // YouTube embeds therefore remain in the page.
            if is_site(url) || is_site_blob(url) || is_local(url) {
                true
            } else {
                open_external(&navigation_app, url);
                false
            }
        })
        .on_new_window(move |url, _| {
            if is_site(&url) || is_site_blob(&url) {
                if let Some(window) = popup_app.get_webview_window("main") {
                    if let Err(error) = window.navigate(url) {
                        log::warn!("Could not navigate internal popup: {error}");
                    }
                }
            } else {
                open_external(&popup_app, &url);
            }
            // Never leave an unmanaged WebView2 popup behind.
            NewWindowResponse::Deny
        })
        .on_download(|webview, event| {
            let app = webview.app_handle();
            match event {
                DownloadEvent::Requested { destination, .. } => {
                    match app.path().download_dir().and_then(|dir| {
                        std::fs::create_dir_all(&dir)?;
                        Ok(download_destination(&dir, destination))
                    }) {
                        Ok(path) => *destination = path,
                        Err(error) => {
                            log::warn!("Downloads directory unavailable: {error}");
                            app.dialog().message("לא ניתן לשמור בתיקיית ההורדות.").title("1לב1").show(|_| {});
                            return false;
                        }
                    }
                }
                DownloadEvent::Finished { path, success, .. } => {
                    if success {
                        if let Some(path) = path {
                            let opener_app = app.clone();
                            app.dialog()
                                .message(format!("הקובץ נשמר בתיקיית ההורדות:\n{}", path.display()))
                                .title("ההורדה הושלמה")
                                .buttons(MessageDialogButtons::OkCancelCustom("הצג בתיקייה".into(), "סגירה".into()))
                                .show(move |reveal| {
                                    if reveal {
                                        let _ = opener_app.opener().reveal_item_in_dir(&path);
                                    }
                                });
                        }
                    } else {
                        app.dialog().message("ההורדה נכשלה. נסו שוב.").title("1לב1").show(|_| {});
                    }
                }
                _ => {}
            }
            true
        })
        .build()?;

    startup_stage("main window created");
    let version = app.package_info().version.to_string();
    startup_stage("configuring WebView2 User-Agent");
    window.with_webview(move |webview| {
        startup_stage("native WebView2 callback entered");
        use webview2_com::{Microsoft::Web::WebView2::Win32::ICoreWebView2Settings2, take_pwstr};
        use windows::core::{HSTRING, Interface, PWSTR};
        // All COM calls are on the WebView's UI thread; take_pwstr frees the
        // CoTaskMem-allocated UA. No remote JavaScript is evaluated here.
        let result = unsafe {
            (|| -> windows::core::Result<()> {
                let settings: ICoreWebView2Settings2 = webview.controller()
                    .CoreWebView2()?.Settings()?.cast()?;
                let mut ua = PWSTR::null();
                settings.UserAgent(&mut ua)?;
                let ua = take_pwstr(ua);
                settings.SetUserAgent(&HSTRING::from(format!("{ua} 1lev1-desktop/{version}")))?;
                Ok(())
            })()
        };
        if let Err(error) = result {
            log::error!("Could not extend WebView2 User-Agent: {error}");
        }
        startup_stage("native WebView2 callback returning");
    })?;
    // setup runs on the UI thread, so with_webview finishes synchronously here.
    // Never call a Tauri window/webview method INSIDE that callback: runtime-wry
    // retains the dispatcher window_id mutex while calling it. Re-entering
    // navigate locks the same non-reentrant mutex and freezes the UI (v0.1.0).
    startup_stage("native callback returned; navigating to local shell");
    window.navigate(Url::parse(LOCAL_SHELL)?)?;
    startup_stage("local shell navigation submitted");
    start_updater(app.handle().clone())?;
    startup_stage("setup complete");
    Ok(())
}

fn download_destination(directory: &Path, suggested: &Path) -> PathBuf {
    static SEQUENCE: AtomicU64 = AtomicU64::new(0);
    let name = suggested.file_name().unwrap_or_default().to_string_lossy();
    let name: String = name.chars().map(|c| {
        if c.is_control() || "<>:\"/\\|?*".contains(c) { '_' } else { c }
    }).take(120).collect();
    let stamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis();
    // Unique prefix also neutralizes Windows device filenames (CON, AUX, ...).
    loop {
        let sequence = SEQUENCE.fetch_add(1, Ordering::Relaxed);
        let path = directory.join(format!("1lev1-{stamp}-{sequence}-{}", name.trim_end_matches(['.', ' '])));
        if !path.exists() { return path; }
    }
}

fn start_updater(app: AppHandle) -> std::io::Result<()> {
    std::thread::Builder::new().name("desktop-updater".into()).spawn(move || loop {
        // Dedicated thread: native blocking dialogs must not block the UI thread.
        if let Err(error) = tauri::async_runtime::block_on(check_update(&app)) {
            log::warn!("Update check failed (will retry in six hours): {error}");
        }
        std::thread::sleep(Duration::from_secs(6 * 60 * 60));
    })?;
    Ok(())
}

async fn check_update(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    log::info!("updater: checking for an update");
    let Some(update) = app.updater_builder().timeout(Duration::from_secs(20)).build()?.check().await? else {
        return Ok(());
    };
    let accepted = app.dialog()
        .message(format!("יש גרסה חדשה ({}), להתקין ולהפעיל מחדש?\nשמרו את העבודה לפני ההתקנה.", update.version))
        .title("עדכון 1לב1")
        .buttons(MessageDialogButtons::OkCancelCustom("התקנה והפעלה מחדש".into(), "לא עכשיו".into()))
        .blocking_show();
    if !accepted { return Ok(()); }
    // Windows installers may terminate this process before install returns.
    let _ = app.save_window_state(WINDOW_STATE);
    if let Err(error) = update.download_and_install(|_, _| {}, || {}).await {
        app.dialog().message("העדכון לא הותקן. אפשר להמשיך לעבוד; ננסה שוב בהמשך.")
            .title("עדכון 1לב1")
            .show(|_| {});
        return Err(error.into());
    }
    app.restart();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exact_domain_boundary_and_safe_schemes() {
        for raw in ["https://1lev1.com/lev", "https://www.1lev1.com/", "https://chat.1lev1.com/a", "https://WWW.1LEV1.COM/"] {
            assert!(is_site(&Url::parse(raw).unwrap()), "{raw}");
        }
        for raw in ["https://1lev1.com.evil.test/", "https://evil1lev1.com/", "https://1lev1.com@evil.test/", "https://evil@1lev1.com/", "file://1lev1.com/a", "javascript:alert(1)", "mailto:a@1lev1.com", "https://youtube.com/"] {
            assert!(!is_site(&Url::parse(raw).unwrap()), "{raw}");
        }
        assert!(is_site_blob(&Url::parse("blob:https://www.1lev1.com/123").unwrap()));
        assert!(!is_site_blob(&Url::parse("blob:https://evil.test/123").unwrap()));
        assert!(!is_local(&Url::parse("http://tauri.localhost/other.html").unwrap()));
    }

    #[test]
    fn downloads_are_unique_and_stay_in_downloads() {
        let dir = Path::new("C:\\Users\\test\\Downloads");
        let suggested = Path::new("C:\\untrusted\\invoice.pdf");
        let first = download_destination(dir, suggested);
        let second = download_destination(dir, suggested);
        assert_eq!(first.parent(), Some(dir));
        assert_eq!(first.extension().unwrap(), "pdf");
        assert_ne!(first, second);
        assert!(download_destination(dir, Path::new("CON")).file_name().unwrap().to_string_lossy().starts_with("1lev1-"));
    }
}
