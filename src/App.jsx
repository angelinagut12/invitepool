import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreateEvent from "./pages/CreateEvent";
import EventPage from "./pages/EventPage";
import HostDashboard from "./pages/HostDashboard";
import EditEvent from "./pages/EditEvent";
import Auth from "./pages/Auth";
import HostEvents from "./pages/HostEvents";
import EditRsvp from "./pages/EditRsvp";
import FindInvite from "./pages/FindInvite";
import MyInvites from "./pages/MyInvites";
import AuthCallback from "./pages/AuthCallback";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateEvent />} />
        <Route path="/event/:id" element={<EventPage />} />
        <Route path="/host/event/:id" element={<HostDashboard />} />
        <Route path="/edit/event/:id" element={<EditEvent />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/host/events" element={<HostEvents />} />
        <Route path="/rsvp/edit/:token" element={<EditRsvp />} />
        <Route path="/find-invite" element={<FindInvite />} />
        <Route path="/my-invites" element={<MyInvites />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
