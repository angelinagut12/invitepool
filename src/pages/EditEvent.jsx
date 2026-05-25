import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import "./CreateEvent.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteImage, setInviteImage] = useState(null);

  const [formData, setFormData] = useState({
    eventTitle: "",
    honoreeName: "",
    eventType: "",
    date: "",
    time: "",
    location: "",
    description: "",
    rsvpDeadline: "",
    backgroundColor: "#f5f5f5",
    guestListVisibility: "private",
    eventCode: "",
    noGuestLimit: true,
    allowedChildren: 0,
    allowedAdults: 0,
    guestLimitNote: "",
    hostEmail: "",
    notifyHostOnRsvp: true,
    notifyHostOnRsvpUpdate: true,
  });

  useEffect(() => {
    fetchEvent();
  }, [id]);

  async function fetchEvent() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        eventTitle: data.event_title || "",
        honoreeName: data.honoree_name || "",
        eventType: data.event_type || "",
        date: data.event_date || "",
        time: data.event_time || "",
        location: data.location || "",
        description: data.description || "",
        rsvpDeadline: data.rsvp_deadline || "",
        backgroundColor: data.background_color || "#f5f5f5",
        guestListVisibility: data.guest_list_visibility || "private",
        eventCode: data.event_code || "",
        noGuestLimit: data.allowed_children == null && data.allowed_adults == null,
        allowedChildren: data.allowed_children ?? 0,
        allowedAdults: data.allowed_adults ?? 0,
        guestLimitNote: data.guest_limit_note || "",
        hostEmail: data.host_email || "",
        notifyHostOnRsvp: data.notify_host_on_rsvp ?? true,
        notifyHostOnRsvpUpdate: data.notify_host_on_rsvp_update ?? true,
      });
    } catch (error) {
      console.error("Error loading event:", error.message);
      alert("There was a problem loading the event.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      let imageUrl = null;

      if (inviteImage) {
        const fileExt = inviteImage.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `invites/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("invite-images")
          .upload(filePath, inviteImage);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("invite-images")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      const updates = {
        event_title: formData.eventTitle,
        honoree_name: formData.honoreeName,
        event_type: formData.eventType,
        event_date: formData.date,
        event_time: formData.time,
        location: formData.location,
        description: formData.description,
        rsvp_deadline: formData.rsvpDeadline,
        background_color: formData.backgroundColor,
        guest_list_visibility: formData.guestListVisibility,
        event_code: formData.eventCode,
        allowed_children: formData.noGuestLimit ? null : Number(formData.allowedChildren || 0),
        allowed_adults: formData.noGuestLimit ? null : Number(formData.allowedAdults || 0),
        guest_limit_note: formData.guestLimitNote || "",
        host_email: formData.hostEmail.trim() || null,
        notify_host_on_rsvp: formData.notifyHostOnRsvp,
        notify_host_on_rsvp_update: formData.notifyHostOnRsvpUpdate,
      };

      if (imageUrl) {
        updates.invite_image_url = imageUrl;
      }

      const { error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      alert("Event updated successfully!");
      navigate(`/host/event/${id}`);
    } catch (error) {
      console.error("Error updating event:", error.message);
      alert("There was a problem updating the event.");
    } finally {
      setSaving(false);
    }
  }
  async function handleDeleteEvent() {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this invite? This will also delete all RSVPs for this event."
    );

    if (!confirmDelete) return;

    try {
      setSaving(true);

      // Delete RSVPs first
      const { error: rsvpDeleteError } = await supabase
        .from("rsvps")
        .delete()
        .eq("event_id", id);

      if (rsvpDeleteError) throw rsvpDeleteError;

      // Delete event
      const { error: eventDeleteError } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (eventDeleteError) throw eventDeleteError;

      alert("Invite deleted successfully.");
      navigate("/host/events");
    } catch (error) {
      console.error("Error deleting invite:", error.message);
      alert("There was a problem deleting the invite.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading event...</div>;
  }

  return (
    <div className="create-event-page">
      <Navbar />
      <div className="create-event-container">
        <div className="create-event-header">
          <h2>Edit Event</h2>
          <p>Update your invite details and save changes.</p>
        </div>

        <div className="create-event-layout">
          <div className="create-event-form-card">
            <form className="create-event-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Event Title</label>
                <input type="text" name="eventTitle" value={formData.eventTitle} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Honoree Name</label>
                <input type="text" name="honoreeName" value={formData.honoreeName} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Event Type</label>
                <input type="text" name="eventType" value={formData.eventType} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Time</label>
                <input type="time" name="time" value={formData.time} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="4" />
              </div>

              <div className="form-group">
                <label>RSVP Deadline</label>
                <input type="date" name="rsvpDeadline" value={formData.rsvpDeadline} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Background Color</label>
                <input
                  className="color-input"
                  type="color"
                  name="backgroundColor"
                  value={formData.backgroundColor}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Guest List Visibility</label>
                <select name="guestListVisibility" value={formData.guestListVisibility} onChange={handleChange}>
                  <option value="private">Private (host only)</option>
                  <option value="public">Public (everyone with link)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Replace Invite Image</label>
                <input type="file" accept="image/*" onChange={(e) => setInviteImage(e.target.files[0])} />
              </div>

              <div className="form-group">
                <label>Event Code</label>
                <input
                  type="text"
                  name="eventCode"
                  value={formData.eventCode}
                  onChange={handleChange}
                  placeholder="Enter a private code"
                />
              </div>

              <div className="form-group">
                <h3 style={{ marginBottom: "0.5rem" }}>Guest Limits</h3>
                <p style={{ fontSize: "0.9rem", color: "#777" }}>
                  Use no limit for open RSVPs, or set adult/kid limits for each invite.
                </p>
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: "500", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="noGuestLimit"
                    checked={formData.noGuestLimit}
                    onChange={handleChange}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <span>No guest limit</span>
                </label>
                <p style={{ fontSize: "0.85rem", color: "#777", marginTop: "0.4rem" }}>
                  Guests can still enter adults and kids, but InvitePool will not cap the invite.
                </p>
              </div>

              <div style={{ display: "flex", gap: "1rem", opacity: formData.noGuestLimit ? 0.55 : 1 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Children Allowed</label>
                  <input
                    type="number"
                    name="allowedChildren"
                    value={formData.allowedChildren}
                    onChange={handleChange}
                    min="0"
                    disabled={formData.noGuestLimit}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Adults Allowed</label>
                  <input
                    type="number"
                    name="allowedAdults"
                    value={formData.allowedAdults}
                    onChange={handleChange}
                    min="0"
                    disabled={formData.noGuestLimit}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Guest Limit Note (optional)</label>
                <input
                  type="text"
                  name="guestLimitNote"
                  value={formData.guestLimitNote}
                  onChange={handleChange}
                  placeholder="Ex: Includes 1 child + 2 adults"
                />
              </div>

              <div
                className="form-group"
                style={{
                  borderTop: "1px solid #eee",
                  paddingTop: "1rem",
                  marginTop: "1rem",
                }}
              >
                <h3 style={{ marginBottom: "0.5rem" }}>Host Notifications</h3>
                <p style={{ color: "#666", fontSize: "0.9rem" }}>
                  Choose whether you want email notifications for this event.
                </p>
              </div>

              <div className="form-group">
                <label>Host Notification Email</label>
                <input
                  type="email"
                  name="hostEmail"
                  value={formData.hostEmail}
                  onChange={handleChange}
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: "500", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="notifyHostOnRsvp"
                    checked={formData.notifyHostOnRsvp}
                    onChange={handleChange}
                    style={{ width: "18px", height: "18px", accentColor: "#8b5cf6", flexShrink: 0 }}
                  />
                  <span>Email me when someone submits an RSVP</span>
                </label>
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: "500", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="notifyHostOnRsvpUpdate"
                    checked={formData.notifyHostOnRsvpUpdate}
                    onChange={handleChange}
                    style={{ width: "18px", height: "18px", accentColor: "#8b5cf6", flexShrink: 0 }}
                  />
                  <span>Email me when someone updates their RSVP</span>
                </label>
              </div>

              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleDeleteEvent}
                disabled={saving}
                style={{
                  background: "#dc2626",
                  color: "white",
                  marginTop: "0.75rem",
                }}
              >
                Delete Invite
              </button>
            </form>
          </div>

          <div className="create-event-preview-card">
            <h3 className="preview-title">Live Preview</h3>

            <div className="preview-box" style={{ backgroundColor: formData.backgroundColor }}>
              <h2>{formData.eventTitle || "Your Event Title"}</h2>

              <p><strong>Honoree:</strong> {formData.honoreeName || "Honoree Name"}</p>
              <p><strong>Type:</strong> {formData.eventType || "Event Type"}</p>
              <p><strong>Date:</strong> {formData.date || "Event Date"}</p>
              <p><strong>Time:</strong> {formData.time || "Event Time"}</p>
              <p><strong>Location:</strong> {formData.location || "Event Location"}</p>
              <p><strong>Description:</strong> {formData.description || "Event description goes here."}</p>
              <p><strong>RSVP By:</strong> {formData.rsvpDeadline || "RSVP Deadline"}</p>
              <p>
                <strong>Invite Includes:</strong>{" "}
                {formData.allowedChildren || 0} child
                {Number(formData.allowedChildren) === 1 ? "" : "ren"} +{" "}
                {formData.allowedAdults || 0} adult
                {Number(formData.allowedAdults) === 1 ? "" : "s"}
              </p>
              {formData.guestLimitNote && (
                <p><strong>Guest Note:</strong> {formData.guestLimitNote}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditEvent;
