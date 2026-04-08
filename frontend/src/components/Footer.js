import { Link, useLocation } from "react-router-dom";

export default function Footer() {
  const { pathname } = useLocation();
  const useLightBackgroundVariant = pathname.startsWith("/vendor") || pathname === "/cart";
  const tone = useLightBackgroundVariant
    ? {
        borderTop: "1px solid rgba(15, 23, 42, 0.12)",
        color: "#334155",
        linkColor: "#0b3153"
      }
    : {
        borderTop: "1px solid rgba(255, 255, 255, 0.2)",
        color: "#ffffff",
        linkColor: "#ffffff"
      };

  return (
    <footer style={{ ...footerStyle, borderTop: tone.borderTop }}>
      <div style={linkRowStyle}>
        <Link to="/contact-us" style={{ ...linkStyle, color: tone.linkColor }}>
          Contact Us
        </Link>
      </div>
      <p style={{ ...copyStyle, color: tone.color }}>&copy; {new Date().getFullYear()} JensnMart</p>
    </footer>
  );
}

const footerStyle = {
  marginTop: 40,
  padding: 15,
  textAlign: "center",
  opacity: 0.9
};

const linkRowStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "16px",
  marginBottom: "8px"
};

const linkStyle = {
  color: "#ffffff",
  fontWeight: 700,
  textDecoration: "none"
};

const copyStyle = {
  margin: 0,
  color: "#ffffff"
};
