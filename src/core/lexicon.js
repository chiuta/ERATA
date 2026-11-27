// Supliment lexical mic, redactat de mână pentru ERATA: internaționalisme și termeni tehnici care apar
// neschimbați în texte din toate limbile (nume de taste, protocoale, formate, mărci, termeni informatici).
// Nu înlocuiește dicționarele Hunspell; se consultă doar după ce dicționarul a respins cuvântul.

const L = (s) => new Set(s.split(/\s+/).filter(Boolean));

/** Valabil în toate limbile (comparație fără diferență de majuscule). */
export const INTL = L(`
  ctrl alt shift esc enter tab backspace capslock numlock pgup pgdn fn altgr
  docs doc readme changelog config configs timeout timeouts script scripts router routers gateway gateways subnet subnets
  firewall proxy proxies wifi wi-fi bluetooth ethernet hotspot modem bandwidth ping dns dhcp
  linux ubuntu debian fedora windows macos android ios iphone ipad chrome chromium firefox safari edge opera github gitlab
  python javascript typescript java rust html css json xml yaml toml sql api apis url urls http https ftp ssh ssl tls vpn
  lan wan usb ssd hdd cpu gpu ram rom bios uefi pdf gif png jpeg jpg svg mp3 mp4 zip exe csv txt
  email e-mail online offline website websites webpage blog blogs forum forums chat chats login logout username password
  download downloads upload uploads app apps bug bugs debug debugging feedback hashtag hashtags link links
  mouse laptop laptops tablet tablets smartphone smartphones hardware software firmware freeware shareware open-source
  driver drivers plugin plugins addon addons browser browsers server servers cloud backup backups update updates upgrade
  upgrades reboot bootloader kernel shell terminal cache caches cookie cookies token tokens pixel pixels bit bits byte bytes
  kilobyte kilobytes megabyte megabytes gigabyte gigabytes terabyte terabytes petabyte petabytes kb mb gb tb
  streaming podcast podcasts playlist wiki wikipedia google youtube facebook twitter instagram whatsapp telegram skype zoom
  microsoft apple amazon netflix spotify linkedin paypal
  desktop dashboard widget widgets toolbar sidebar popup popups checkbox dropdown scroll scrolling touchscreen
  startup freelancer freelancing marketing management online-shop shop
  ok okay internet
  hz khz mhz ghz thz kw mw gw kwh mwh kv mv mah dpi ppi fps rpm bpm
  rsync scp sftp curl wget grep sed awk sudo bash zsh cron crontab vim emacs nginx docker dockerfile kubernetes redis postgres
  postgresql mysql mariadb sqlite mongodb graphql oauth jwt regex regexp cli gui ide sdk repo repos npm yarn pnpm pip git svn
  webpack eslint nodejs deno wasm webassembly localhost stdout stderr stdin chmod chown mkdir gzip unzip smtp imap tcp udp
  ipv4 ipv6 nat
`);

/** Specifice unei limbi: unități informatice și termeni care nu sunt în dicționarul Hunspell livrat. */
export const EXTRA = {
  ro: L(`megabait megabaiți gigabait gigabaiți terabait terabaiți kilobait kilobaiți petabait petabaiți octet octeți megaoctet megaocteți
    gigaoctet gigaocteți teraoctet teraocteți scripturi routere subrețea subrețele`),
  es: L(`subred subredes`),
  pt: L(`sub-rede sub-redes`),
  fr: L(`sous-réseau`),
  en: L(`subnet`),
};

/** Cuvântul (fără diferență de majuscule) este acceptat de supliment pentru limba dată? */
export function lexiconHas(lang, word) {
  const w = word.toLowerCase();
  return INTL.has(w) || !!EXTRA[lang]?.has(w);
}
