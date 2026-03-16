export function NightSky() {
  return (
    <div className="night-sky" aria-hidden="true">
      <div className="night-sky__stars night-sky__stars--slow" />
      <div className="night-sky__stars night-sky__stars--medium" />
      <div className="night-sky__stars night-sky__stars--fast" />
      <div className="night-sky__stars night-sky__stars--extra" />
      <div className="night-sky__moon-wrap">
        <div className="night-sky__moon-halo" />
        <div className="night-sky__moon" />
      </div>
      <div className="night-sky__horizon" />
    </div>
  );
}
