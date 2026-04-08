import { supabase } from "../components/supabaseClient";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateEvent.css";
import Footer from "../components/Footer";

export default function CreateEvent() {
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

const [inviteImage, setInviteImage] = useState(null);

//NAVIGATION TO EVENT PAGE WITH DYNAMIC ID
const navigate = useNavigate();

//CHECK IF USER IS LOGGED IN ON PAGE LOAD
useEffect(() => {
  checkUser();
}, []);

async function checkUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in first.");
    navigate("/auth");
  }
}

//FUNCTIONS TO HANDLE FORM SUBMISSION AND INPUT CHANGES
async function handleSubmit(e) {
  e.preventDefault();

  //CHECK USER AGAIN BEFORE SUBMITTING
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in first.");
    navigate("/auth");
    return;
  }

  let imageUrl = null;

  if (inviteImage) {
    const fileExt = inviteImage.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `invites/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("invite-images")
      .upload(filePath, inviteImage);

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      alert("There was a problem uploading the invite image.");
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("invite-images")
      .getPublicUrl(filePath);

    imageUrl = publicUrlData.publicUrl;
  }

  const { data, error } = await supabase
    .from("events")
    .insert([
      {
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
        invite_image_url: imageUrl,
        event_code: formData.eventCode,
        created_by: user.id,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error saving event:", error);
    alert("There was a problem saving the event.");
    return;
  }

  navigate(`/host/event/${data.id}`);
}
function handleChange(event) {
  const { name, value } = event.target;
  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
}


return (
  <div className="create-event-page">
    <div className="create-event-container">
      <div className="create-event-header">
        <h2>Create Event</h2>
        <p>Build your invitation and preview it as you go.</p>
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
                placeholder="Adalyn’s First Birthday"
              />
            </div>

            <div className="form-group">
              <label>Honoree Name</label>
              <input
                type="text"
                name="honoreeName"
                value={formData.honoreeName}
                onChange={handleChange}
                placeholder="Adalyn"
              />
            </div>

            <div className="form-group">
              <label>Event Type</label>
              <input
                type="text"
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                placeholder="Birthday Party"
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
                placeholder="123 Main St, Dallas, TX"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Join us for a special celebration..."
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
              <label>Invite Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setInviteImage(e.target.files[0])}
              />
            </div>
            <div className="form-group">
              <label>Event Code</label>
              <span style={{ fontSize: "0.8rem", color: "#888" }}>
                Guests will use this code to open the invite. Keep it simple and memorable.
              </span>
              <input
                type="text"
                name="eventCode"
                value={formData.eventCode}
                onChange={handleChange}
                placeholder="Enter a private code (e.g. FAIRY123)"
              />
            </div>

            {/* CREATE EVENT BUTTON */}
            <button type="submit">Create Event</button>
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
    <Footer />
  </div>
  );
}