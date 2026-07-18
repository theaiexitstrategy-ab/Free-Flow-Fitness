export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap">
        {/* teal ornate logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="footer-logo"
          src="/logos/ff-teal-ornate.png"
          alt="Free Flow Fitness"
        />
        <p>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          &nbsp;·&nbsp;
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
        </p>
        <p style={{ marginTop: 12 }}>
          © {year} Free Flow Fitness · Bridgeton, MO
        </p>
      </div>
    </footer>
  );
}
