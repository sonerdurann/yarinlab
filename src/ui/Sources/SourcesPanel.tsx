import { assetLicenses, sources } from '../../data/sources';
import { teacherStore, useTeacherState } from '../../state/teacherStore';
import { Modal } from '../Modal/Modal';

/** Kaynaklar ve lisanslar (kılavuz §05, §24, §28; T10). */
export function SourcesPanel() {
  const { sourcesOpen } = useTeacherState();
  if (!sourcesOpen) return null;
  return (
    <Modal titleId="sp-title" title="Kaynaklar ve lisanslar" onClose={teacherStore.closeSources}>
      <p>Görsel varlıklar Kenney paketlerinden (CC0, ticari kullanım serbest) alınmıştır; atıf zorunlu değildir, teşekkür ederiz.</p>
      <table className="result">
        <caption className="sr-only">Asset lisansları</caption>
        <thead>
          <tr><th scope="col">Paket</th><th scope="col">Lisans</th><th scope="col">İndirme</th></tr>
        </thead>
        <tbody>
          {assetLicenses.map((a) => (
            <tr key={a.name}>
              <th scope="row">{a.url ? <a href={a.url} target="_blank" rel="noreferrer">{a.name}</a> : a.name}</th>
              <td>{a.license}</td>
              <td>{a.downloaded}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Kaynaklar</h3>
      <ul className="source-list">
        {sources.map((s) => (
          <li key={s.id}>
            [{s.id}] <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
            {s.note && <small> – {s.note}</small>}
          </li>
        ))}
      </ul>
      <p className="notice">Oyundaki değerler simülasyon göstergeleridir; gerçek saha ölçümü veya kanıtlanmış karbon azaltımı değildir.</p>
      <div className="actions">
        <button className="primary" onClick={teacherStore.closeSources}>Kapat</button>
      </div>
    </Modal>
  );
}
