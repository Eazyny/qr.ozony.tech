import QrScene from './components/QrScene';
import QrHeader from './components/QrHeader';
import BusinessCardPanel from './components/BusinessCardPanel';
import StarryBackground from './components/StarryBackground';
import { qrPayload } from './lib/qrPayload';
import './styles/app.css';

function App() {
  return (
    <div className="app-shell">
      <div className="app-shell__background">
        <StarryBackground />
      </div>

      <div className="app-shell__scene">
        <QrScene payload={qrPayload} />
      </div>

      <div className="scene-vignette" />
      <div className="scene-grid" />

      <div className="app-shell__ui">
        <QrHeader />

        <main className="layout-shell">
          <div className="layout-shell__spacer" />
          <div className="layout-shell__card-wrap">
            <BusinessCardPanel />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;