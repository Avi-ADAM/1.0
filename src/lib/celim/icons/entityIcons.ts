/**
 * The rikma vocabulary, as icons.
 *
 * Lives in a module rather than in `EntityIcon.svelte` so the plain-JS
 * components that build icon tables can name the union in a JSDoc `@type`
 * annotation and still be checked — `as const` is not available to them.
 *
 * Adding a row here is all it takes to make a new `kind` valid everywhere.
 */
import Boxes from '@lucide/svelte/icons/boxes';
import Wrench from '@lucide/svelte/icons/wrench';
import Package from '@lucide/svelte/icons/package';
import Gift from '@lucide/svelte/icons/gift';
import Sparkles from '@lucide/svelte/icons/sparkles';
import Handshake from '@lucide/svelte/icons/handshake';
import Megaphone from '@lucide/svelte/icons/megaphone';
import MapIcon from '@lucide/svelte/icons/map';
import MapPin from '@lucide/svelte/icons/map-pin';
import Globe from '@lucide/svelte/icons/globe';
import Users from '@lucide/svelte/icons/users';
import CirclePlay from '@lucide/svelte/icons/circle-play';
import X from '@lucide/svelte/icons/x';
import User from '@lucide/svelte/icons/user';
import Coins from '@lucide/svelte/icons/coins';
import CalendarDays from '@lucide/svelte/icons/calendar-days';
import Repeat from '@lucide/svelte/icons/repeat';
import InfinityIcon from '@lucide/svelte/icons/infinity';
import Heart from '@lucide/svelte/icons/heart';
import MessageCircle from '@lucide/svelte/icons/message-circle';
import Video from '@lucide/svelte/icons/video';
import Lock from '@lucide/svelte/icons/lock';
import Share2 from '@lucide/svelte/icons/share-2';
import ClipboardList from '@lucide/svelte/icons/clipboard-list';
import Send from '@lucide/svelte/icons/send';
import BellOff from '@lucide/svelte/icons/bell-off';
import PenLine from '@lucide/svelte/icons/pen-line';
import Hourglass from '@lucide/svelte/icons/hourglass';
import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
import Settings from '@lucide/svelte/icons/settings';
import LinkIcon from '@lucide/svelte/icons/link';
import Github from '@lucide/svelte/icons/github';
import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
import Play from '@lucide/svelte/icons/play';
import RefreshCw from '@lucide/svelte/icons/refresh-cw';
import CircleAlert from '@lucide/svelte/icons/circle-alert';
import Compass from '@lucide/svelte/icons/compass';
import ListChecks from '@lucide/svelte/icons/list-checks';
import Timer from '@lucide/svelte/icons/timer';
import Brain from '@lucide/svelte/icons/brain';
import Plus from '@lucide/svelte/icons/plus';
import Scale from '@lucide/svelte/icons/scale';
import Sprout from '@lucide/svelte/icons/sprout';
import IdCard from '@lucide/svelte/icons/id-card';
import ConciergeBell from '@lucide/svelte/icons/concierge-bell';
import Briefcase from '@lucide/svelte/icons/briefcase';
import Receipt from '@lucide/svelte/icons/receipt';
import Mail from '@lucide/svelte/icons/mail';
import MailCheck from '@lucide/svelte/icons/mail-check';
import HandCoins from '@lucide/svelte/icons/hand-coins';
import ContactRound from '@lucide/svelte/icons/contact-round';
import Smartphone from '@lucide/svelte/icons/smartphone';
import Rocket from '@lucide/svelte/icons/rocket';
import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';
import ScrollText from '@lucide/svelte/icons/scroll-text';
import Earth from '@lucide/svelte/icons/earth';
import DoorOpen from '@lucide/svelte/icons/door-open';
import Dna from '@lucide/svelte/icons/dna';
import ChartPie from '@lucide/svelte/icons/chart-pie';
import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
import CircleCheck from '@lucide/svelte/icons/circle-check';
import Store from '@lucide/svelte/icons/store';
import CreditCard from '@lucide/svelte/icons/credit-card';
import TrendingUp from '@lucide/svelte/icons/trending-up';
import Lightbulb from '@lucide/svelte/icons/lightbulb';
import KeyRound from '@lucide/svelte/icons/key-round';
import Eye from '@lucide/svelte/icons/eye';
import EyeOff from '@lucide/svelte/icons/eye-off';
import Star from '@lucide/svelte/icons/star';
import Sunrise from '@lucide/svelte/icons/sunrise';
import Calendar from '@lucide/svelte/icons/calendar';
import Flag from '@lucide/svelte/icons/flag';
import ChartColumn from '@lucide/svelte/icons/chart-column';
import Search from '@lucide/svelte/icons/search';
import ThumbsUp from '@lucide/svelte/icons/thumbs-up';
import Bot from '@lucide/svelte/icons/bot';
import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
import House from '@lucide/svelte/icons/house';
import Bell from '@lucide/svelte/icons/bell';
import CaseSensitive from '@lucide/svelte/icons/case-sensitive';
import Languages from '@lucide/svelte/icons/languages';
import Pencil from '@lucide/svelte/icons/pencil';
import Highlighter from '@lucide/svelte/icons/highlighter';
import FileText from '@lucide/svelte/icons/file-text';
import Zap from '@lucide/svelte/icons/zap';
import Palette from '@lucide/svelte/icons/palette';
import Diamond from '@lucide/svelte/icons/diamond';
import Baby from '@lucide/svelte/icons/baby';
import Leaf from '@lucide/svelte/icons/leaf';
import Mic from '@lucide/svelte/icons/mic';
import Paperclip from '@lucide/svelte/icons/paperclip';
import Puzzle from '@lucide/svelte/icons/puzzle';
import Vote from '@lucide/svelte/icons/vote';
import Hand from '@lucide/svelte/icons/hand';
import Inbox from '@lucide/svelte/icons/inbox';
import FolderTree from '@lucide/svelte/icons/folder-tree';
import SmartphoneNfc from '@lucide/svelte/icons/smartphone-nfc';
import Save from '@lucide/svelte/icons/save';
import Target from '@lucide/svelte/icons/target';

export const ENTITY_ICONS = {
  rikma: Boxes,
  mission: Wrench,
  resource: Package,
  product: Gift,
  wish: Sparkles,
  maagad: Handshake,
  offer: Megaphone,
  map: MapIcon,
  place: MapPin,
  online: Globe,
  members: Users,
  person: User,
  money: Coins,
  date: CalendarDays,
  recurring: Repeat,
  endless: InfinityIcon,
  support: Heart,
  chat: MessageCircle,
  video: Video,
  private: Lock,
  share: Share2,
  offers: ClipboardList,
  send: Send,
  silence: BellOff,
  signed: PenLine,
  waiting: Hourglass,
  cart: ShoppingCart,
  settings: Settings,
  link: LinkIcon,
  github: Github,
  discord: Gamepad2,
  start: Play,
  refresh: RefreshCw,
  alert: CircleAlert,

  // The app's own map, as the guide page indexes it.
  hub: Compass,
  lev: Heart,
  tasks: ListChecks,
  timer: Timer,
  moach: Brain,
  add: Plus,
  votes: Scale,
  opportunity: Sprout,
  rikmaPage: IdCard,
  concierge: ConciergeBell,
  deals: Briefcase,
  receipt: Receipt,
  mail: Mail,
  mailSent: MailCheck,
  offerings: HandCoins,
  identity: ContactRound,
  devices: Smartphone,
  onboard: Rocket,
  faq: CircleQuestionMark,
  agreement: ScrollText,
  world: Earth,
  signup: DoorOpen,
  profile: Dna,
  split: ChartPie,
  service: ShoppingBag,
  done: CircleCheck,
  store: Store,
  card: CreditCard,
  growth: TrendingUp,
  idea: Lightbulb,
  key: KeyRound,
  reveal: Eye,
  conceal: EyeOff,
  star: Star,
  sunrise: Sunrise,
  calendar: Calendar,
  finish: Flag,
  chart: ChartColumn,
  search: Search,
  vote: ThumbsUp,
  ai: Bot,
  reset: RotateCcw,
  home: House,
  notifications: Bell,
  textSize: CaseSensitive,
  language: Languages,
  edit: Pencil,
  edited: Highlighter,
  document: FileText,
  urgent: Zap,
  appearance: Palette,
  equity: Diamond,
  family: Baby,
  community: Leaf,
  voice: Mic,
  attach: Paperclip,
  piece: Puzzle,
  ballot: Vote,
  volunteer: Hand,
  inbox: Inbox,
  folders: FolderTree,
  telegram: SmartphoneNfc,
  save: Save,
  target: Target,
  audience: Users,
  motion: CirclePlay,
  close: X
} as const;

/** Every name `EntityIcon`'s `kind` prop accepts. */
export type EntityIconKind = keyof typeof ENTITY_ICONS;
