import React from 'react';
//import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import { AdmissionProvider, useAdmission } from './context/AdmissionContext';
import { AppRoutes } from './routes/AppRoutes';
import { FullPageLoader } from './components/common/FullPageLoader';

const AppLoaderGate: React.FC = () => {
  const { appLoading } = useAdmission();
  // const [minElapsed, setMinElapsed] = useState(false);

  // useEffect(() => {
  //   const timer = setTimeout(() => setMinElapsed(true), 5000);
  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <AnimatePresence>
      {appLoading && <FullPageLoader key="app-loader" />};
      {/* {(appLoading || !minElapsed) && <FullPageLoader key="app-loader" />} */}
    </AnimatePresence>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AdmissionProvider>
          <AppLoaderGate />
          <AppRoutes />
        </AdmissionProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
