const card = {
  title: 'IT & Network Solutions',
  description:
    'Small-business networking, Wi-Fi, firewall, and support designed to look clean, work reliably, and scale with you.',
  email: 'contact@ozony.tech',
  website: 'https://ozony.tech',
  location: 'NYC · NJ · Remote-ready',
  services: [
    'Network Setup',
    'Business Wi-Fi',
    'Firewall & Security',
    'IT Support',
  ],
};

function downloadVCard() {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Ozony Tech',
    'ORG:Ozony Tech',
    `TITLE:${card.title}`,
    `EMAIL;TYPE=INTERNET:${card.email}`,
    `URL:${card.website}`,
    `NOTE:${card.description}`,
    'END:VCARD',
  ];

  const blob = new Blob([lines.join('\n')], {
    type: 'text/vcard;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'ozony-tech.vcf';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function BusinessCardPanel() {
  return (
    <section className="identity-card">
      <div className="identity-card__shine" />

      <h1 className="identity-card__title">{card.title}</h1>

      <p className="identity-card__description">{card.description}</p>

      <div className="identity-card__meta">
        <span>{card.location}</span>
        <span className="identity-card__dot">•</span>
        <a href={`mailto:${card.email}`}>{card.email}</a>
      </div>

      <div className="identity-card__actions">
        <button
          type="button"
          className="action-button action-button--primary"
          onClick={downloadVCard}
        >
          Save Contact
        </button>

        <a
          className="action-button action-button--secondary"
          href={`mailto:${card.email}`}
        >
          Email
        </a>

        <a
          className="action-button action-button--secondary"
          href={card.website}
          target="_blank"
          rel="noreferrer"
        >
          Visit Website
        </a>
      </div>

      <div className="identity-card__chips">
        {card.services.map((service) => (
          <span key={service} className="service-chip">
            {service}
          </span>
        ))}
      </div>
    </section>
  );
}

export default BusinessCardPanel;