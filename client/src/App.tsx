import { EthProvider } from "./contexts/EthContext";
import Booking from "./components/Booking";
import Footer from "./components/Footer";
import Nav from "./components/Nav";
import "./App.scss";

function App () {
  return (
    <div id="App" >
      <Nav />
      <EthProvider>
        <Booking />
      </EthProvider>
      <Footer />
    </div>
  );
}

export default App;
