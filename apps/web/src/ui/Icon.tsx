/** Kenney Game Icons (CC0) simgesi; süs amaçlıdır (erişilebilir ad düğmede verilir). */
export type IconName = 'gear' | 'question' | 'menuList' | 'zoomIn' | 'zoomOut' | 'information' | 'warning' | 'trophy' | 'home' | 'wrench' | 'star' | 'musicOn' | 'target' | 'checkmark';
export function Icon({ name, tone = 'white', size = 22 }: { name: IconName; tone?: 'white' | 'black'; size?: number }) {
  return <img className="kicon" src={`/assets/kenney/icons/${tone}/${name}.png`} alt="" aria-hidden="true" width={size} height={size} draggable={false} />;
}
