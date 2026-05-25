import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { sendEmail } from "../utils/sendEmail";

if (!document.getElementById("host-dashboard-styles")) {
  const style = document.createElement("style");
  style.id = "host-dashboard-styles";
  style.textContent = `
    .host-card {
      background: #fff;
      border-radius: 18px;
      padding: 1.5rem;
      box-shadow: 0 6px 18px rgba(80, 60, 100, 0.08);
    }

    .host-title {
      color: #6f627d;
      margin-bottom: 1rem;
    }

    .host-text {
      color: #6f627d;
      margin: 0.35rem 0;
    }

    .host-input {
      width: 100%;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #d8cde6;
      box-sizing: border-box;
      background: white;
    }

    .host-section-title {
      color: #6f627d;
      margin-bottom: 1rem;
    }

    .host-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .host-btn,
    .host-btn-ghost {
      border: none;
      border-radius: 10px;
      padding: 10px 14px;
      cursor: pointer;
      font-weight: 600;
    }

    .host-btn {
      background: #6f627d;
      color: white;
    }

    .host-btn-ghost {
      background: #ede9fe;
      color: #6f627d;
    }

    .host-list-card {
      border: 1px solid #e8dff0;
      border-radius: 14px;
      padding: 1rem;
      background: #ffffff;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .host-list-title {
      font-weight: 700;
      color: #6f627d;
      margin-bottom: 0.35rem;
    }

    .host-muted {
      font-size: 0.85rem;
      color: #9b8daa;
    }

    .host-danger-btn {
      background: #c97b86;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 8px 12px;
      cursor: pointer;
      height: fit-content;
    }
    
    .host-dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .host-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    @media (max-width: 768px) {
      .host-dashboard-grid {
        grid-template-columns: 1fr;
      }

      .host-card {
        padding: 1.25rem;
      }

      .host-title {
        font-size: 2rem;
        line-height: 1.1;
      }

      .host-actions {
        display: grid;
        grid-template-columns: 1fr;
      }

      .host-btn,
      .host-btn-ghost {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(style);
}

export default function HostDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [showAddRsvp, setShowAddRsvp] = useState(false);
  const [showGuestResponses, setShowGuestResponses] = useState(true);
  const [editingRsvpId, setEditingRsvpId] = useState(null);

  const [manualRsvp, setManualRsvp] = useState({
    guestName: "",
    email: "",
    phone: "",
    attending: "yes",
    adults: 1,
    children: 0,
    message: "",
  });
  const [loading, setLoading] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");
  const [showGuestBreakdown, setShowGuestBreakdown] = useState(false);
  const [showContactsPanel, setShowContactsPanel] = useState(false);
  const [showUpdatesPanel, setShowUpdatesPanel] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");

  const [eventUpdates, setEventUpdates] = useState([]);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [notifyGuests, setNotifyGuests] = useState(false);
  const [sendingUpdate, setSendingUpdate] = useState(false);
  const rsvpFormRef = useRef(null);
  const firstRsvpInputRef = useRef(null);

  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [id]);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (eventError) throw eventError;

      if (!eventData || eventData.created_by !== user.id) {
        navigate("/");
        return;
      }

      setEvent(eventData);

      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvps")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false });

      if (rsvpError) throw rsvpError;

      setRsvps(rsvpData || []);

      await fetchContacts(user.id);
      await fetchEventUpdates();
    } catch (error) {
      console.error("Error loading dashboard:", error.message);
      setContactSuccess("There was an error loading the dashboard.");
      setTimeout(() => setContactSuccess(""), 2500);
    } finally {
      setLoading(false);
    }
  }

  async function fetchContacts(currentUserId) {
    try {
      const { data, error } = await supabase
        .from("invite_contacts")
        .select("*")
        .eq("event_id", Number(id))
        .eq("created_by", currentUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setContacts(data || []);
    } catch (error) {
      console.error("Error loading contacts:", error.message);
      setContactSuccess("Could not load contacts.");
      setTimeout(() => setContactSuccess(""), 2500);
    }
  }

  async function fetchEventUpdates() {
    try {
      const { data, error } = await supabase
        .from("event_updates")
        .select("*")
        .eq("event_id", Number(id))
        .order("created_at", { ascending: false });

      if (error) throw error;

      setEventUpdates(data || []);
    } catch (error) {
      console.error("Error loading event updates:", error.message);
    }
  }

  async function addEventUpdate() {
    const trimmedTitle = updateTitle.trim();
    const trimmedMessage = updateMessage.trim();

    if (!trimmedTitle || !trimmedMessage) {
      setUpdateStatus("Please enter both a title and message.");
      setTimeout(() => setUpdateStatus(""), 2000);
      return;
    }

    if (!user) {
      setUpdateStatus("You must be logged in.");
      setTimeout(() => setUpdateStatus(""), 2000);
      return;
    }

    try {
      setSendingUpdate(true);
      const { data, error } = await supabase
        .from("event_updates")
        .insert([
          {
            event_id: Number(id),
            created_by: user.id,
            title: trimmedTitle,
            message: trimmedMessage,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      let notifiedCount = 0;

      if (notifyGuests) {
        const guestsToNotify = rsvps.filter((guest) => {
          const status = getStatus(guest.attending);
          return (
            (status === "yes" || status === "maybe") &&
            guest.email &&
            guest.email.trim()
          );
        });

        if (guestsToNotify.length > 0) {
          const publicLink = `${window.location.origin}/event/${event.id}`;

          const results = await Promise.allSettled(
            guestsToNotify.map((guest) =>
              sendEmail({
                to: guest.email.trim().toLowerCase(),
                subject: `Update for ${event.event_title || "your event"}: ${trimmedTitle}`,
                html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
                  <h2 style="color:#6f627d;">${trimmedTitle}</h2>
                  <p>Hi ${guest.guest_name || "there"},</p>
                  <p>There is an update for <strong>${event.event_title || "your event"}</strong>.</p>
                  <p style="white-space:pre-line;">${trimmedMessage}</p>
                  <a href="${publicLink}" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#6f627d;color:white;border-radius:10px;text-decoration:none;font-weight:600;">View Invite</a>
                </div>`,
              })
            )
          );

          notifiedCount = results.filter((result) => result.status === "fulfilled").length;

          const failedCount = results.length - notifiedCount;
          if (failedCount > 0) {
            console.error(`${failedCount} update email(s) failed to send.`);
          }
        }
      }

      setEventUpdates((prev) => [data, ...prev]);
      setUpdateTitle("");
      setUpdateMessage("");
      setNotifyGuests(false);
      setUpdateStatus(
        notifyGuests
          ? `Update posted and emailed to ${notifiedCount} guest${notifiedCount === 1 ? "" : "s"}.`
          : "Update posted!"
      );
      setTimeout(() => setUpdateStatus(""), 3500);
    } catch (error) {
      console.error("Error posting update:", error.message);
      setUpdateStatus("Could not post update.");
      setTimeout(() => setUpdateStatus(""), 2000);
    } finally {
      setSendingUpdate(false);
    }
  }
  async function handleAddManualRsvp(e) {
      e.preventDefault();

    try {
      const adults = Number(manualRsvp.adults || 0);
      const children = Number(manualRsvp.children || 0);

      if (adults + children < 1) {
        setContactSuccess("Please enter at least 1 adult or kid.");
        return;
      }

      const { data, error } = await supabase
        .from("rsvps")
        .insert([
          {
            event_id: Number(id),
            guest_name: manualRsvp.guestName,
            email: manualRsvp.email.trim().toLowerCase() || null,
            phone: manualRsvp.phone.trim() || null,
            attending: manualRsvp.attending,
            adults,
            children,
            guest_count: adults + children,
            message: manualRsvp.message,
            edit_token: crypto.randomUUID(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setRsvps((prev) => [data, ...prev]);

      setManualRsvp({
        guestName: "",
        email: "",
        phone: "",
        attending: "yes",
        adults: 1,
        children: 0,
        message: "",
      });

      setShowAddRsvp(false);
      setContactSuccess("RSVP added!");
      setTimeout(() => setContactSuccess(""), 2000);

    } catch (error) {
      console.error("Error adding RSVP:", error.message);
      setContactSuccess("There was a problem adding the RSVP.");
      setTimeout(() => setContactSuccess(""), 2500);
    }
  }

  function startEditingRsvp(guest) {
    setEditingRsvpId(guest.id);
    setManualRsvp({
      guestName: guest.guest_name || "",
      email: guest.email || "",
      phone: guest.phone || "",
      attending: guest.attending || "yes",
      adults: guest.adults ?? 1,
      children: guest.children ?? 0,
        message: guest.message || "",
      });
    setShowAddRsvp(false);

    window.requestAnimationFrame(() => {
      rsvpFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      firstRsvpInputRef.current?.focus();
    });
  }

  async function handleUpdateRsvp(e) {
    e.preventDefault();

    try {
      const adults = Number(manualRsvp.adults || 0);
      const children = Number(manualRsvp.children || 0);

      if (adults + children < 1) {
        setContactSuccess("Please enter at least 1 adult or kid.");
        return;
      }

      const { data, error } = await supabase
        .from("rsvps")
        .update({
          guest_name: manualRsvp.guestName,
          email: manualRsvp.email.trim().toLowerCase() || null,
          phone: manualRsvp.phone.trim() || null,
          attending: manualRsvp.attending,
          adults,
          children,
          guest_count: adults + children,
          message: manualRsvp.message,
        })
        .eq("id", editingRsvpId)
        .select()
        .single();

      if (error) throw error;

      setRsvps((prev) =>
        prev.map((r) => (r.id === editingRsvpId ? data : r))
      );

      setEditingRsvpId(null);
      setManualRsvp({
        guestName: "",
        email: "",
        phone: "",
        attending: "yes",
        adults: 1,
        children: 0,
        message: "",
      });

      setContactSuccess("RSVP updated!");
      setTimeout(() => setContactSuccess(""), 2000);

    } catch (error) {
      console.error("Error updating RSVP:", error.message);
      setContactSuccess("There was a problem updating the RSVP.");
      setTimeout(() => setContactSuccess(""), 2500);
    }
  }
  async function deleteEventUpdate(updateId) {
    try {
      const { error } = await supabase
        .from("event_updates")
        .delete()
        .eq("id", updateId);

      if (error) throw error;

      setEventUpdates((prev) => prev.filter((item) => item.id !== updateId));
    } catch (error) {
      console.error("Error deleting update:", error.message);
      setUpdateStatus("Could not delete update.");
      setTimeout(() => setUpdateStatus(""), 2000);
    }
  }
  function getStatus(value) {
    if (value === "yes" || value === true || value === "true") return "yes";
    if (value === "no" || value === false || value === "false") return "no";
    if (value === "maybe") return "maybe"; 
    
  }
  const stats = useMemo(() => {
    const total = rsvps.length;

    const attendingRsvps = rsvps.filter((r) => r.attending === "yes");

    const attending = attendingRsvps.length;
    const maybe = rsvps.filter((r) => r.attending === "maybe").length;
    const notAttending = rsvps.filter((r) => r.attending === "no").length;

    const totalAttendingGuests = attendingRsvps.reduce(
      (sum, r) => sum + Number(r.guest_count || 0),
      0
    );

    const adultsAttending = attendingRsvps.reduce(
      (sum, r) => sum + Number(r.adults || 0),
      0
    );

    const kidsAttending = attendingRsvps.reduce(
      (sum, r) => sum + Number(r.children || 0),
      0
    );

    return {
      total,
      attending,
      maybe,
      notAttending,
      totalAttendingGuests,
      adultsAttending,
      kidsAttending,
    };
  }, [rsvps]);

  async function copyInviteLink() {
    if (!event) return;

    const publicLink = `${window.location.origin}/event/${event.id}`;

    try {
      await navigator.clipboard.writeText(publicLink);
      setCopyMessage("Invite link copied!");
      setTimeout(() => setCopyMessage(""), 2000);
    } catch (error) {
      console.error("Copy failed:", error.message);
      setCopyMessage("Could not copy link.");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  }

  async function shareInvite() {
    if (!event) return;

    const publicLink = `${window.location.origin}/event/${event.id}`;
    const message = `You're invited to ${event.event_title || "my event"} 🎉

RSVP here: ${publicLink}

You can optionally opt in for event text updates on the RSVP form.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.event_title || "Event Invite",
          text: message,
          url: publicLink,
        });
      } catch (error) {
        console.error("Share cancelled or failed:", error.message);
      }
    } else {
      try {
        await navigator.clipboard.writeText(message);
        setCopyMessage("Invite message copied!");
        setTimeout(() => setCopyMessage(""), 2000);
      } catch (error) {
        console.error("Copy failed:", error.message);
        setCopyMessage("Could not copy invite message.");
        setTimeout(() => setCopyMessage(""), 2000);
      }
    }
  }

  async function handleDeleteRsvp(rsvpId) {
    const confirmed = window.confirm("Are you sure you want to delete this RSVP?");
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("rsvps").delete().eq("id", rsvpId);

      if (error) throw error;

      setRsvps((prev) => prev.filter((rsvp) => rsvp.id !== rsvpId));
    } catch (error) {
      console.error("Error deleting RSVP:", error.message);
      setContactSuccess("There was a problem deleting the RSVP.");
      setTimeout(() => setContactSuccess(""), 2500);
    }
  }

  async function addContact() {
    const trimmedName = contactName.trim();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedName) {
      setContactSuccess("Please enter a name.");
      setTimeout(() => setContactSuccess(""), 2000);
      return;
    }

    if (!user) {
      setContactSuccess("You must be logged in.");
      setTimeout(() => setContactSuccess(""), 2000);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("invite_contacts")
        .insert([
          {
            event_id: Number(id),
            created_by: user.id,
            name: trimmedName,
            phone: trimmedPhone || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setContacts((prev) => [data, ...prev]);
      setContactName("");
      setContactPhone("");
      setContactSuccess("Contact added!");
      setTimeout(() => setContactSuccess(""), 2000);
    } catch (error) {
      console.error("Error adding contact:", error.message);
      setContactSuccess("Error saving contact.");
      setTimeout(() => setContactSuccess(""), 2000);
    }
  }

  async function removeContact(contactId) {
    try {
      const { error } = await supabase
        .from("invite_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;

      setContacts((prev) => prev.filter((contact) => contact.id !== contactId));
      setContactSuccess("Contact removed.");
      setTimeout(() => setContactSuccess(""), 2000);
    } catch (error) {
      console.error("Error removing contact:", error.message);
      setContactSuccess("Error removing contact.");
      setTimeout(() => setContactSuccess(""), 2000);
    }
  }

  function shareInviteToContact(contact) {
    if (!event || !contact.phone) return;

    const publicLink = `${window.location.origin}/event/${event.id}`;
    const message = `Hi ${contact.name}! You're invited to ${
      event.event_title || "my event"
    } 🎉

RSVP here: ${publicLink}

You can optionally opt in for event text updates on the RSVP form.`;

    const smsLink = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
    window.location.href = smsLink;
  }

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading dashboard...</div>;
  }

  if (!event) {
    return <div style={{ padding: "2rem" }}>No event found.</div>;
  }

    return (
      <div style={{ background: "#f6f2fb", minHeight: "100vh" }}>
        <Navbar />

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1rem" }}>
          <div className="host-dashboard-grid">
          <div className="host-card">
            <h1 className="host-title">{event.event_title}</h1>

            <p className="host-text"><strong>Date:</strong> {event.event_date || "Not set"}</p>
            <p className="host-text"><strong>Time:</strong> {event.event_time || "Not set"}</p>
            <p className="host-text"><strong>Location:</strong> {event.location || "Not set"}</p>
            <p className="host-text">
              <strong>Guest list visibility:</strong> {event.guest_list_visibility || "Not set"}
            </p>

            <div className="host-actions">
              <button className="host-btn" onClick={copyInviteLink}>Copy Invite Link</button>
              <button className="host-btn-ghost" onClick={() => navigate(`/event/${event.id}`)}>View Public Page</button>
              <button className="host-btn-ghost" onClick={shareInvite}>Share Invite</button>
              <button className="host-btn-ghost" onClick={() => navigate(`/edit/event/${event.id}`)}>Edit Event</button>
              <button className="host-btn-ghost" onClick={() => navigate("/host/events")}>Back to All Events</button>
            </div>

            {copyMessage && <p style={{ marginTop: "0.75rem", color: "#6f627d" }}>{copyMessage}</p>}
          </div>

          <div className="host-card">
            {event.invite_image_url ? (
              <a href={event.invite_image_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={event.invite_image_url}
                  alt="Invite"
                  style={{
                    width: "100%",
                    borderRadius: "14px",
                    objectFit: "contain",
                    cursor: "zoom-in",
                  }}
                />
              </a>
            ) : (
              <p className="host-text">No invite image uploaded</p>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <StatCard label="Total Responses" value={stats.total} />
          <StatCard label="Attending" value={stats.attending} />
          <StatCard label="Maybe" value={stats.maybe} />
          <StatCard label="Not Attending" value={stats.notAttending} />
          <StatCard
            label="Guests Attending"
            value={stats.totalAttendingGuests}
            onClick={() => setShowGuestBreakdown((prev) => !prev)}
            active={showGuestBreakdown}
          />
        </div>

        {showGuestBreakdown && (
            <div className="host-card" style={{ marginBottom: "2rem" }}>
              <h2 className="host-section-title">Guest Breakdown</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div>
                  <p className="host-muted">Adults Going</p>
                  <h3 style={{ margin: 0, fontSize: "2rem", color: "#6f627d" }}>
                    {stats.adultsAttending}
                  </h3>
                </div>

                <div>
                  <p className="host-muted">Kids Going</p>
                  <h3 style={{ margin: 0, fontSize: "2rem", color: "#6f627d" }}>
                    {stats.kidsAttending}
                  </h3>
                </div>

                <div>
                  <p className="host-muted">Total Guests Going</p>
                  <h3 style={{ margin: 0, fontSize: "2rem", color: "#6f627d" }}>
                    {stats.totalAttendingGuests}
                  </h3>
                </div>
              </div>
            </div>
          )}

        <div style={{ display: "flex", flexDirection: "column" }}>
        <DashboardSection title="Invite Contacts" style={{ order: 3 }}>
          <button
            className="host-btn-ghost"
            type="button"
            onClick={() => setShowContactsPanel((prev) => !prev)}
            style={{ marginBottom: showContactsPanel ? "1rem" : 0 }}
          >
            {showContactsPanel ? "Hide invite contacts" : "Need to invite by text?"}
          </button>

          {showContactsPanel && (
            <>
              <div style={{ display: "grid", gap: "1rem", marginBottom: "1rem" }}>
                <input className="host-input" type="text" placeholder="Guest name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                <input className="host-input" type="tel" placeholder="Phone number" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                <button className="host-btn" onClick={addContact}>Add Contact</button>
                {contactSuccess && <p className="host-text">{contactSuccess}</p>}
              </div>

              {contacts.length === 0 ? (
                <p className="host-text">No contacts added yet.</p>
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {contacts.map((contact) => (
                    <div key={contact.id} className="host-list-card">
                      <div>
                        <p className="host-list-title">{contact.name}</p>
                        <p className="host-text">{contact.phone || "No phone yet"}</p>
                      </div>

                      <div className="host-actions">
                        <button
                          className="host-btn-ghost"
                          onClick={() => shareInviteToContact(contact)}
                          disabled={!contact.phone}
                        >
                          Share Invite
                        </button>
                        <button className="host-danger-btn" onClick={() => removeContact(contact.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DashboardSection>

        <DashboardSection title="Event Updates" style={{ order: 2 }}>
          <button
            className="host-btn-ghost"
            type="button"
            onClick={() => setShowUpdatesPanel((prev) => !prev)}
            style={{ marginBottom: showUpdatesPanel ? "1rem" : 0 }}
          >
            {showUpdatesPanel ? "Hide event update tools" : "Need to make an update?"}
          </button>

          {showUpdatesPanel && (
            <>
              <div style={{ display: "grid", gap: "1rem", marginBottom: "1rem" }}>
                <input className="host-input" type="text" placeholder="Update title" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} />
                <textarea className="host-input" placeholder="Write your update here..." value={updateMessage} onChange={(e) => setUpdateMessage(e.target.value)} rows="4" />
                <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", color: "#6f627d", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={notifyGuests}
                    onChange={(e) => setNotifyGuests(e.target.checked)}
                    style={{ marginTop: "0.2rem", width: 16, height: 16 }}
                  />
                  <span>Notify guests by email</span>
                </label>
                <p className="host-muted" style={{ marginTop: "-0.5rem" }}>
                  Sends only to guests marked Yes or Maybe who have an email address.
                </p>
                <button className="host-btn" onClick={addEventUpdate} disabled={sendingUpdate}>
                  {sendingUpdate ? "Posting..." : "Post Update"}
                </button>
                {updateStatus && <p className="host-text">{updateStatus}</p>}
              </div>

              {eventUpdates.length === 0 ? (
                <p className="host-text">No updates posted yet.</p>
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {eventUpdates.map((item) => (
                    <div key={item.id} className="host-list-card">
                      <div>
                        <h3 className="host-list-title">{item.title}</h3>
                        <p className="host-text" style={{ whiteSpace: "pre-line" }}>{item.message}</p>
                        <p className="host-muted">
                          {item.created_at ? new Date(item.created_at).toLocaleString() : "Unknown"}
                        </p>
                      </div>
                      <button className="host-danger-btn" onClick={() => deleteEventUpdate(item.id)}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DashboardSection>

        <DashboardSection title="Guest Responses" style={{ order: 1 }}>
          <button
            className="host-btn"
            onClick={() => {
              setShowAddRsvp(!showAddRsvp);
              setEditingRsvpId(null);
              setManualRsvp({
                guestName: "",
                email: "",
                phone: "",
                attending: "yes",
                adults: 1,
                children: 0,
                message: "",
              });
            }}
            style={{ marginBottom: "1rem" }}
          >
            {showAddRsvp ? "Cancel" : "+ Add RSVP Manually"}
          </button>

          <button
            className="host-btn-ghost"
            type="button"
            onClick={() => setShowGuestResponses((prev) => !prev)}
            style={{ marginBottom: "1rem", marginLeft: "0.75rem" }}
          >
            {showGuestResponses ? "Hide guest list" : `Show guest list (${rsvps.length})`}
          </button>

          {(showAddRsvp || editingRsvpId) && (
            <form
              ref={rsvpFormRef}
              onSubmit={editingRsvpId ? handleUpdateRsvp : handleAddManualRsvp}
              style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}
            >
             <div style={{ display: "flex", gap: "1rem" }}>
              <label style={{ flex: 1, color: "#6f627d", fontWeight: 600 }}>
                Adults
                <input
                  ref={firstRsvpInputRef}
                  className="host-input"
                  type="number"
                  min="0"
                  placeholder="Adults"
                  value={manualRsvp.adults}
                  onChange={(e) =>
                    setManualRsvp({ ...manualRsvp, adults: e.target.value })
                  }
                />
              </label>
              <label style={{ flex: 1, color: "#6f627d", fontWeight: 600 }}>
                Kids
                <input
                  className="host-input"
                  type="number"
                  min="0"
                  placeholder="Kids"
                  value={manualRsvp.children}
                  onChange={(e) => setManualRsvp({ ...manualRsvp, children: e.target.value })}
                />
              </label>
            </div>

              <input
                className="host-input"
                type="email"
                placeholder="Email"
                value={manualRsvp.email}
                onChange={(e) =>
                  setManualRsvp({ ...manualRsvp, email: e.target.value })
                }
              />

              <input
                className="host-input"
                type="tel"
                placeholder="Phone"
                value={manualRsvp.phone}
                onChange={(e) =>
                  setManualRsvp({ ...manualRsvp, phone: e.target.value })
                }
              />

              <select
                className="host-input"
                value={manualRsvp.attending}
                onChange={(e) =>
                  setManualRsvp({ ...manualRsvp, attending: e.target.value })
                }
              >
                <option value="yes">Yes</option>
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
              </select>

              <textarea
                className="host-input"
                placeholder="Message"
                value={manualRsvp.message}
                onChange={(e) =>
                  setManualRsvp({ ...manualRsvp, message: e.target.value })
                }
                rows="3"
              />

              <div className="host-actions">
                <button className="host-btn" type="submit">
                  {editingRsvpId ? "Update RSVP" : "Save RSVP"}
                </button>

                <button
                  className="host-btn-ghost"
                  type="button"
                  onClick={() => {
                    setEditingRsvpId(null);
                    setShowAddRsvp(false);
                    setManualRsvp({
                      guestName: "",
                      email: "",
                      phone: "",
                      attending: "yes",
                      adults: 1,
                      children: 0,
                      message: "",
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!showGuestResponses ? (
            <p className="host-text">
              Guest list hidden. {rsvps.length} response{rsvps.length === 1 ? "" : "s"} saved.
            </p>
          ) : rsvps.length === 0 ? (
            <p className="host-text">No responses yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {rsvps.map((guest) => (
                <div key={guest.id} className="host-list-card">
                  <div>
                    <p className="host-list-title">
                      {guest.guest_name || "No name"}
                      {guest.guest_count > 1 && (
                        <span className="host-muted"> + {guest.guest_count - 1}</span>
                      )}
                      <span style={{ marginLeft: "6px" }}>
                         { { yes: "✅", no: "❌", maybe: "❔" }[guest.attending] || "❔" }      
                      </span>
                    </p>
                    {guest.adults != null && guest.children != null && (
                      <p className="host-muted">
                        {guest.adults} adult{Number(guest.adults) === 1 ? "" : "s"} ·{" "}
                        {guest.children} kid{Number(guest.children) === 1 ? "" : "s"}
                      </p>
                    )}

                    {guest.message && <p className="host-text">{guest.message}</p>}
                    {guest.email && (
                      <p className="host-text">
                        <strong>Email:</strong> {guest.email}
                      </p>
                    )}
                    {guest.phone && (
                      <p className="host-text">
                        <strong>Phone:</strong> {guest.phone}
                      </p>
                    )}
                    <p className="host-text">
                      <strong>SMS Opt-In:</strong> {guest.sms_opt_in ? "Yes" : "No"}
                    </p>
                    <p className="host-muted">
                      {guest.created_at
                        ? new Date(guest.created_at).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>

                  <div className="host-actions">
                    <button
                      className="host-btn-ghost"
                      onClick={() => startEditingRsvp(guest)}
                    >
                      Edit RSVP
                    </button>

                    <button
                      className="host-danger-btn"
                      onClick={() => handleDeleteRsvp(guest.id)}
                    >
                      Delete RSVP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>
        </div>
        <Footer />
      </div>
    </div>
  );
}

function StatCard({ label, value, onClick, active }) {
  return (
    <button
      type="button"
      className="host-card"
      onClick={onClick}
      style={{
        textAlign: "center",
        border: active ? "2px solid #6f627d" : "1px solid #e8dff0",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <p className="host-text" style={{ marginBottom: "0.5rem" }}>
        {label}
      </p>
      <h3 style={{ margin: 0, fontSize: "2rem", color: "#6f627d" }}>
        {value}
      </h3>
    </button>
  );
}

function DashboardSection({ title, children, style }) {
  return (
    <div className="host-card" style={{ marginBottom: "2rem", ...style }}>
      <h2 className="host-section-title">{title}</h2>
      {children}
    </div>
  );
}
