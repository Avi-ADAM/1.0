#[cfg(all(desktop, target_os = "windows"))]
mod desktop;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(all(desktop, target_os = "windows"))]
    let builder = desktop::configure(builder);

    builder
        .setup(|app| {
            // Preserve the existing non-Windows/mobile debug logger. Windows
            // installs its bounded file logger in desktop::setup, including release.
            #[cfg(not(all(desktop, target_os = "windows")))]
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            #[cfg(all(desktop, target_os = "windows"))]
            desktop::setup(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
