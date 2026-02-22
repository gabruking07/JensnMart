import { useEffect, useState } from "react";
import api from "../../services/api";
import "../admin.css";

export default function ProfileTab() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/admin/me").then(res => setUser(res.data));
  }, []);

  if (!user) return <div className="profile-wrap">Loading...</div>;

  return (
    <div className="profile-wrap">
      <h1>My Profile</h1>

      <div className="profile-card">
        <div className="profile-row">
          <label>Name</label>
          <span>{user.name}</span>
        </div>

        <div className="profile-row">
          <label>Email</label>
          <span>{user.email}</span>
        </div>

        <div className="profile-row">
          <label>Phone</label>
          <span>{user.phone}</span>
        </div>

        <div className="profile-row">
          <label>Role</label>
          <span className={`role ${user.role}`}>
            {user.role}
          </span>
        </div>

        <div className="profile-row">
          <label>Joined</label>
          <span>
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}