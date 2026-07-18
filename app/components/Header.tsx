const STUDIO_PHONE = "314-625-2323";

export default function Header() {
  return (
    <header className="header">
      <div className="wrap header-inner">
        {/* black FF circle mark, inverted to read on the dark bar */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="header-logo"
          src="/logos/ff-black-mark.png"
          alt="Free Flow Fitness"
        />
        <nav className="nav">
          <ul>
            <li>
              <a href="#parties">Parties</a>
            </li>
            <li>
              <a href="#classes">Classes</a>
            </li>
            <li>
              <a href="#private">Private Lessons</a>
            </li>
            <li>
              <a href="#visit">Visit Us</a>
            </li>
            <li>
              <a href={`tel:${STUDIO_PHONE.replace(/[^0-9]/g, "")}`}>
                {STUDIO_PHONE}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
