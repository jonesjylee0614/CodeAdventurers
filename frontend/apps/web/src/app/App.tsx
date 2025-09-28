import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { Providers } from './providers';

export const App = () => (
  <Providers>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </Providers>
);

export default App;
