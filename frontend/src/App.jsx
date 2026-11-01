
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreatePoll from "./pages/CreatePoll";
import Vote from "./pages/Vote";
import Results from "./pages/Results";

import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        {/* Login required for voting */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/poll/:id"
            element={<Vote />}
          />
        </Route>

        {/* Results page */}
        <Route
          path="/results/:id"
          element={<Results />}
        />

        {/* Login required for poll management */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/create"
            element={<CreatePoll />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
