/** Administrator contact messages tab screen; loads and updates the corresponding marketplace records through the shared API client. */

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import "../admin.css";

/** Converts a date into the date-and-time format used in this screen. */
const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

/** Renders the contact messages tab interface and coordinates the state and actions for this screen or reusable component. */
export default function ContactMessagesTab() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
        /** Fetches public contact form submissions for admin review. */
        const loadMessages = async () => {
      try {
        const { data } = await api.get("/admin/contact-messages");
        setMessages(data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load contact messages");
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, []);

  const filteredMessages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return messages;

    return messages.filter((message) =>
      [message.name, message.email, message.subject, message.message, message.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [messages, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="contact-messages-page admin-panel-page">
        <div className="contact-messages-loading">Loading contact messages...</div>
      </div>
    );
  }

  return (
    <div className="contact-messages-page admin-panel-page">
      <section className="admin-page-hero">
        <div className="admin-page-hero-copy">
          <p className="admin-page-eyebrow">Customer inbox</p>
          <h1>Review every Contact Us submission from one admin page.</h1>
          <p>
            This page shows the full message history submitted from the public Contact Us form,
            including sender details, subject line, and submission time.
          </p>
        </div>

        <div className="admin-page-hero-status">
          <span>Total messages</span>
          <strong>{messages.length}</strong>
          <p>{filteredMessages.length} messages match the current search filter.</p>
        </div>
      </section>

      <section className="contact-messages-toolbar">
        <div>
          <h2>Contact form submissions</h2>
          <p>Search by name, email, subject, message text or status.</p>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search contact messages"
          className="contact-messages-search"
        />
      </section>

      <div className="table">
        <div className="table-toolbar">
          <p className="table-count">
            Showing {filteredMessages.length === 0 ? 0 : startIndex + 1}-
            {Math.min(endIndex, filteredMessages.length)} of {filteredMessages.length} messages
          </p>
          <div className="table-page-size">
            <label htmlFor="contact-messages-page-size">Items per page</label>
            <select
              id="contact-messages-page-size"
              value={itemsPerPage}
              onChange={(event) => setItemsPerPage(Number(event.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
        </div>

        <section className="contact-messages-list">
          {filteredMessages.length === 0 ? (
            <div className="contact-messages-empty">No contact messages found.</div>
          ) : (
            paginatedMessages.map((message) => (
              <article key={message._id} className="contact-message-card">
                <div className="contact-message-card-head">
                  <div>
                    <span className="contact-message-kicker">{message.status || "new"}</span>
                    <h3>{message.subject || "General enquiry"}</h3>
                  </div>
                  <span className="contact-message-time">{formatDateTime(message.createdAt)}</span>
                </div>

                <div className="contact-message-meta">
                  <div>
                    <span>Name</span>
                    <strong>{message.name}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{message.email}</strong>
                  </div>
                </div>

                <div className="contact-message-body">
                  <span>Message</span>
                  <p>{message.message}</p>
                </div>
              </article>
            ))
          )}
        </section>

        {filteredMessages.length > 0 && (
          <div className="pagination-bar">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
