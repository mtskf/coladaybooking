import { EthProvider } from "./contexts/EthContext";
import Booking from "./components/Booking";
import "./App.scss";

function App () {
  return (
    <EthProvider>
      <div id="App" >
        <div className="container">
          <Booking />
        </div>
      </div>
    </EthProvider>
  );
}

export default App;
