import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ParkingFloorProvider } from './context/ParkingFloorContext';
import ParkingAppRoutes from './ParkingAppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <ParkingFloorProvider>
        <BrowserRouter>
          <ParkingAppRoutes embedded={false} />
        </BrowserRouter>
      </ParkingFloorProvider>
    </AuthProvider>
  );
}
