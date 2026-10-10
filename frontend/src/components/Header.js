/** Reusable header UI component; packages interface behavior used by one or more application screens. */

/** Renders the header interface and coordinates the state and actions for this screen or reusable component. */
export default function Header({ title }) {
  return (
    <div
      style={{
        position: "relative",
        height: "70px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: "5px solid #eee"
      }}>

      <h1
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "42px",
          fontWeight: "700",
          margin: 0
        }}>
        {title}
      </h1>
    </div>
  );
}