import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements
} from "react-router-dom";
import "./App.css";
import { AriesProvider } from "./AriesProvider";
import ChatUI from "./Chat";
import Connections from "./Connections";
import CreateAgent from "./CreateAgent";
import Credential from "./Credential";
import Credentials from "./Credentials";
import Dashboard from "./Dashboard";
import Proofs from "./Proofs";
import Proof from "./Proof";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route path="" element={<CreateAgent />} />
      <Route path="/login" element={<CreateAgent />} />
      <Route path="/dashboard" element={<Dashboard />}>
        <Route path="" element={<Connections />} />
        <Route path="connections" element={<Connections />} />
        <Route path="credentials" element={<Credentials />} />
        <Route path="proofs" element={<Proofs />} />
        <Route path="chat/:connectionId" element={<ChatUI />} />
        <Route path="credentials/:credentialId" element={<Credential />} />
        <Route path="proofs/:proofId" element={<Proof />} />
      </Route>
    </Route>
  )
);
function App() {
  return (
    <AriesProvider>
      <RouterProvider router={router} />
    </AriesProvider>
  );
}
export default App;