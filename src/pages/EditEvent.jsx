import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import "./CreateEvent.css";

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
      });
    } catch (error) {
      console.error("Error loading event:", error.message);
      alert("There was a problem loading the event.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading event...</div>;
  }

  return (
    <div className="create-event-page">
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
                <input
                  type="text"
                  name="eventTitle"
                  value={formData.eventTitle}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Honoree Name</label>
                <input
                  type="text"
                  name="honoreeName"
                  value={formData.honoreeName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Event Type</label>
                <input
                  type="text"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>RSVP Deadline</label>
                <input
                  type="date"
                  name="rsvpDeadline"
                  value={formData.rsvpDeadline}
                  onChange={handleChange}
                />
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
                <select
                  name="guestListVisibility"
                  value={formData.guestListVisibility}
                  onChange={handleChange}
                >
                  <option value="private">Private (host only)</option>
                  <option value="public">Public (everyone with link)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Replace Invite Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setInviteImage(e.target.files[0])}
                />
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

              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="create-event-preview-card">
            <h3 className="preview-title">Live Preview</h3>

            <div
              className="preview-box"
              style={{ backgroundColor: formData.backgroundColor }}
            >
              <h2>{formData.eventTitle || "Your Event Title"}</h2>

              <p>
                <strong>Honoree:</strong> {formData.honoreeName || "Honoree Name"}
              </p>

              <p>
                <strong>Type:</strong> {formData.eventType || "Event Type"}
              </p>

              <p>
                <strong>Date:</strong> {formData.date || "Event Date"}
              </p>

              <p>
                <strong>Time:</strong> {formData.time || "Event Time"}
              </p>

              <p>
                <strong>Location:</strong> {formData.location || "Event Location"}
              </p>

              <p>
                <strong>Description:</strong>{" "}
                {formData.description || "Event description goes here."}
              </p>

              <p>
                <strong>RSVP By:</strong> {formData.rsvpDeadline || "RSVP Deadline"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditEvent;