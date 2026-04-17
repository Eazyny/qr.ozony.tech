import QrScene from './components/QrScene';
import QrHeader from './components/QrHeader';
import BusinessCardPanel from './components/BusinessCardPanel';
import { qrPayload } from './lib/qrPayload';
import './styles/app.css';

function App() {
  return (
    <div className="app-shell">
      <QrScene payload={qrPayload} />

      <div className="scene-vignette" />
      <div className="scene-grid" />

      <QrHeader />

      <main className="layout-shell">
        <div className="layout-shell__spacer" />
        <div className="layout-shell__card-wrap">
          <BusinessCardPanel />
        </div>
      </main>
    </div>
  );
}

export default App;