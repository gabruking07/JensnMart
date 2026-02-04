export default function Footer() {
  return (
    <footer style={footerStyle}>
      <p>© {new Date().getFullYear()} JensnMart</p>
    </footer>
  );
}

const footerStyle = {
  marginTop: 40,
  padding: 15,
  textAlign: "center",
  borderTop: "1px solid #ccc",
  opacity: 0.8
};