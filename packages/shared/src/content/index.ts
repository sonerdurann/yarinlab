import { TASK_FILES } from './taskFiles';

export type ModuleId = 'energy' | 'carbon' | 'city' | 'food' | 'ocean' | 'waste' | 'council';
export type Resources5 = { budget: number; foodWasteKg: number; energyScore: number; waterScore: number; wellbeing: number };
export type TaskChoice = {
  id: string; label: string; summary: string; deltas: Partial<Resources5>; tradeoff: string;
  system?: Record<string, number>; systemAdd?: Record<string, number>;
  /** Bu seçimi gerekçesiz/yanlış gerekçeyle seçmek yaygın bir kavram yanılgısına işaret edebilir. */
  misconception?: string;
};
export type TaskDef = {
  id: string; module: ModuleId; order: number; version: string; title: string; brief: string;
  facts?: { label: string; value: string }[];
  baseline: Resources5; choices: TaskChoice[]; noDecision: TaskChoice;
  learningOutcomeIds: string[]; evidenceRefs: string[]; disclaimer: string;
  reasoningOptions: string[]; transferQuestion: string;
  realWorldAction: { title: string; action: string; measurementPlan: string[] };
  requires?: string;
};

export type ModuleDef = { id: ModuleId; name: string; subtitle: string; hotspot: string; description: string; outcomes: string[] };
export const MODULES: ModuleDef[] = [
  { id: 'energy', name: 'Enerji Adası', subtitle: 'Yenilenebilir Enerji ve Sürdürülebilirlik', hotspot: 'energy', description: 'Güneş, rüzgâr, depolama ve verimlilikle şehrin enerji dengesini kur.', outcomes: ['EN1', 'EN2', 'EN3'] },
  { id: 'carbon', name: 'Karbon Dedektifleri', subtitle: 'Karbon Ayak İzi ve Bilinçli Tüketim', hotspot: 'farm', description: 'Ürünlerin yaşam döngüsünü ve çevreci iddiaları kanıtla incele.', outcomes: ['CA1', 'CA2', 'CA3'] },
  { id: 'city', name: 'KrizKenti', subtitle: 'İklim Dirençli Şehirler', hotspot: 'city', description: 'Sel, sıcak dalga ve kuraklığa karşı adil uyum planla.', outcomes: ['CI1', 'CI2', 'CI3'] },
  { id: 'food', name: 'Son Tabak', subtitle: 'Gıda Güvenliği ve Sürdürülebilir Tarım', hotspot: 'canteen', description: 'Kantin, depo, sera ve tedarik zincirinde israfı azalt.', outcomes: ['L1', 'FO2', 'FO3'] },
  { id: 'ocean', name: 'Mavi Nöbet', subtitle: 'Okyanuslar ve Denizler', hotspot: 'ocean', description: 'Kıyı kirliliğinin kaynağını bul, habitatları koru.', outcomes: ['OC1', 'OC2', 'OC3'] },
  { id: 'waste', name: 'Döngü Ustaları', subtitle: 'Sıfır Atık ve Döngüsel Ekonomi', hotspot: 'waste', description: 'Önle, azalt, yeniden kullan, ayrıştır: atık hiyerarşisini uygula.', outcomes: ['WA1', 'WA2', 'WA3'] },
  { id: 'council', name: 'Gelecek Meclisi', subtitle: 'İklim Odağında Karar Verme', hotspot: 'school', description: 'Önceki modüllerin kanıtıyla farklı grupları dinle ve 2040 planını oyla.', outcomes: ['CO1', 'CO2', 'CO3'] },
];
export const moduleById = (id: string) => MODULES.find((m) => m.id === id);

/** Öğrenme kazanımları: modül kazanımları + modüller arası genel kazanımlar (L*). */
export const LEARNING_OUTCOMES: Record<string, string> = {
  L1: 'Gıda israfının çevre, bütçe ve sosyal etkileri arasında neden-sonuç ilişkisi kurar.',
  L2: 'En az iki çözüm seçeneğini veri ve gerekçe ile karşılaştırır.',
  L3: 'Çevresel kararların ödünleşimlerini açıklar; tek göstergenin yetmediğini kavrar.',
  L4: 'Gerçek okulda ölçülebilir bir azaltma önerisi geliştirir.',
  L5: 'Simülasyon sonucu ile gerçek saha verisini ayırt eder.',
  EN1: 'Yenilenebilir üretimin gün/gece ve havaya göre değiştiğini açıklar.',
  EN2: 'Depolama ve verimliliğin arz-talep dengesindeki rolünü değerlendirir.',
  EN3: 'Enerji yatırımlarının maliyet, güvenilirlik ve emisyon ödünleşimlerini karşılaştırır.',
  CA1: 'Bir ürünün yaşam döngüsü aşamalarını sıralar ve karşılaştırır.',
  CA2: 'Çevreci iddiaları kanıt ve kaynak açısından sorgular.',
  CA3: 'Onarma, yeniden kullanma ve satın almama seçeneklerini karşılaştırır.',
  CI1: 'Sel, sıcak hava dalgası ve kuraklık riskini azaltan uyum önlemlerini açıklar.',
  CI2: 'Uyum bütçesini öncelik ve kanıta göre dağıtır.',
  CI3: 'İklim risklerinin mahalleler ve gruplar arasında eşit dağılmadığını fark eder.',
  FO2: 'Kuraklığın ve su kullanımının gıda üretimine etkisini açıklar.',
  FO3: 'Gıda tedarik zincirindeki kayıp noktalarını belirler.',
  OC1: 'Deniz kirliliğinin kara kaynaklı nedenlerini açıklar.',
  OC2: 'Deniz ısınmasının ekosisteme etkisini ve diğer baskılarla birleşimini anlatır.',
  OC3: 'Koruma alanlarının ve ekosistem iyileşmesinin zaman ve izleme gerektirdiğini değerlendirir.',
  WA1: 'Atık hiyerarşisini (önle > azalt > yeniden kullan > geri dönüştür > bertaraf) uygular.',
  WA2: 'Ayrıştırma ve geri dönüşümün koşullarını ve sınırlarını açıklar.',
  WA3: 'Atık yönetim bütçesini uzun vadeli etkiye göre dengeler.',
  CO1: 'Farklı toplumsal grupların ihtiyaçlarını karşılaştırır.',
  CO2: 'Kararını önceki modüllerden kanıtla savunur.',
  CO3: 'Uzun vadeli etkileri kısa vadeli kazançlarla karşılaştırır.',
};

/** Bilimsel ve kurumsal kaynaklar (genel sayfa bağlantıları). Oyun katsayıları bu kaynakların nitel bulgularına dayanır; büyüklükler varsayımdır. */
export type ScienceSource = { id: string; title: string; org: string; url: string };
export const SCIENCE_SOURCES: ScienceSource[] = [
  { id: 'R-IPCC-AR6-WG2', org: 'IPCC', title: 'AR6 Çalışma Grubu II: Etkiler, Uyum ve Kırılganlık (2022)', url: 'https://www.ipcc.ch/report/ar6/wg2/' },
  { id: 'R-IPCC-AR6-WG3', org: 'IPCC', title: 'AR6 Çalışma Grubu III: İklim Değişikliğinin Azaltımı (2022)', url: 'https://www.ipcc.ch/report/ar6/wg3/' },
  { id: 'R-IPCC-AR6-SYR', org: 'IPCC', title: 'AR6 Sentez Raporu (2023)', url: 'https://www.ipcc.ch/report/ar6/syr/' },
  { id: 'R-IPCC-SROCC', org: 'IPCC', title: 'Değişen İklimde Okyanus ve Kriyosfer Özel Raporu (2019)', url: 'https://www.ipcc.ch/srocc/' },
  { id: 'R-IEA-RENEW', org: 'IEA', title: 'Renewables (yenilenebilir enerji ve sistem esnekliği)', url: 'https://www.iea.org/energy-system/renewables' },
  { id: 'R-IEA-EFF', org: 'IEA', title: 'Energy Efficiency and Demand', url: 'https://www.iea.org/energy-system/energy-efficiency-and-demand' },
  { id: 'R-UNEP-WASTE', org: 'UNEP', title: 'Global Waste Management Outlook 2024', url: 'https://www.unep.org/resources/global-waste-management-outlook-2024' },
  { id: 'R-UNEP-PLASTIC', org: 'UNEP', title: 'Plastic Pollution', url: 'https://www.unep.org/plastic-pollution' },
  { id: 'R-UNEP-COOL', org: 'UNEP', title: 'Beating the Heat: Sustainable Cooling Handbook for Cities (2021)', url: 'https://www.unep.org/resources/report/beating-heat-sustainable-cooling-handbook-cities' },
  { id: 'R-UNEP-LCI', org: 'UNEP', title: 'Life Cycle Initiative', url: 'https://www.lifecycleinitiative.org/' },
  { id: 'R-UNEP-FWI', org: 'UNEP', title: 'Food Waste Index Report 2024', url: 'https://www.unep.org/resources/publication/food-waste-index-report-2024' },
  { id: 'R-UNESCO-ESD', org: 'UNESCO', title: 'Education for Sustainable Development', url: 'https://www.unesco.org/en/sustainable-development/education' },
  { id: 'R-UNESCO-WATER', org: 'UNESCO', title: 'UN World Water Development Report', url: 'https://www.unesco.org/reports/wwdr/en' },
  { id: 'R-FAO-SOFA', org: 'FAO', title: 'The State of Food and Agriculture 2019: Food Loss and Waste', url: 'https://www.fao.org/state-of-food-agriculture/2019/en/' },
  { id: 'R-ISO14040', org: 'ISO', title: 'ISO 14040: Yaşam Döngüsü Değerlendirmesi – İlkeler ve Çerçeve', url: 'https://www.iso.org/standard/37456.html' },
  { id: 'R-EU-GREENCLAIMS', org: 'Avrupa Komisyonu', title: 'Green Claims (yanıltıcı çevreci iddialar)', url: 'https://environment.ec.europa.eu/topics/circular-economy/green-claims_en' },
  { id: 'R-AFAD', org: 'AFAD', title: 'Afet ve Acil Durum Yönetimi Başkanlığı', url: 'https://www.afad.gov.tr/' },
  { id: 'R-MGM', org: 'MGM', title: 'Meteoroloji Genel Müdürlüğü', url: 'https://www.mgm.gov.tr/' },
  { id: 'R-SIFIRATIK', org: 'T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı', title: 'Sıfır Atık', url: 'https://sifiratik.gov.tr/' },
];

export const TASKS: TaskDef[] = (TASK_FILES as unknown as TaskDef[]).slice().sort(
  (a, b) => MODULES.findIndex((m) => m.id === a.module) - MODULES.findIndex((m) => m.id === b.module) || a.order - b.order,
);
export const taskById = (id: string) => TASKS.find((t) => t.id === id);
export const tasksOfModule = (m: string) => TASKS.filter((t) => t.module === m);

/** Gelecek Meclisi kapıları: meclis önceki modüllerin kanıtına dayanır. */
export const COUNCIL_GATES: Record<string, { minCompleted?: number; everyModule?: boolean }> = {
  council_002: { minCompleted: 5 },
  council_003: { minCompleted: 10 },
  council_005: { everyModule: true },
};

export type TaskStatus = 'done' | 'available' | 'locked';
export function taskStatus(taskId: string, completed: readonly string[]): { status: TaskStatus; reason?: string } {
  const t = taskById(taskId);
  if (!t) return { status: 'locked', reason: 'Bilinmeyen görev' };
  if (completed.includes(taskId)) return { status: 'done' };
  if (t.requires && !completed.includes(t.requires)) return { status: 'locked', reason: `Önce “${taskById(t.requires)?.title}” görevini gerekçeli tamamla.` };
  const g = COUNCIL_GATES[taskId];
  if (g?.minCompleted && completed.length < g.minCompleted) return { status: 'locked', reason: `Meclis için en az ${g.minCompleted} görev tamamla (şu an ${completed.length}).` };
  if (g?.everyModule) {
    const missing = MODULES.filter((m) => m.id !== 'council' && !completed.some((c) => taskById(c)?.module === m.id));
    if (missing.length) return { status: 'locked', reason: `Final için her modülden en az bir görev gerekir: ${missing.map((m) => m.name).join(', ')}.` };
  }
  return { status: 'available' };
}
/** Modülde oynanacak sıradaki görev (yoksa son görev). */
export function nextTaskOf(moduleId: string, completed: readonly string[]): TaskDef {
  const ts = tasksOfModule(moduleId);
  return ts.find((t) => taskStatus(t.id, completed).status === 'available') ?? ts.filter((t) => completed.includes(t.id)).pop() ?? ts[0];
}

/** Hikâye bölümleri: tamamlanan görev sayısına göre ilerler. */
export const STORY_CHAPTERS = [
  { min: 0, title: 'Bölüm 1 · Mesaj', text: '2040’tan gelen mesajı aldın. Küçük okulun ve çevresi senin sorumluluğunda.' },
  { min: 5, title: 'Bölüm 2 · Okul Büyüyor', text: 'Kararların fark edildi: yeni yapılar açılıyor, mahalle seni izliyor.' },
  { min: 14, title: 'Bölüm 3 · Şehir Sınavda', text: 'Sıcak dalgalar ve fırtınalar şehrin dayanıklılığını sınıyor. Kanıt topla.' },
  { min: 24, title: 'Bölüm 4 · Meclis Toplanıyor', text: 'Farklı grupların sesi meclise taşınıyor. 2040 planı yaklaşıyor.' },
];
export const chapterFor = (completedCount: number) => [...STORY_CHAPTERS].reverse().find((c) => completedCount >= c.min)!;

/** Final: 2040 senaryosu şehir göstergelerinden deterministik olarak belirlenir (oyun kurgusu). */
export type EndingInput = { resilience: number; ecosystem: number; wellbeing: number; emissionIndex: number; literacy: number; balancedPlan: boolean };
export type Ending = { key: 'thriving' | 'transition' | 'fragile'; title: string; text: string; score: number };
export function endingFor(i: EndingInput): Ending {
  const score = Math.round((i.resilience + i.ecosystem + i.wellbeing + Math.max(0, 140 - i.emissionIndex) * 0.7 + i.literacy) / 4.7 + (i.balancedPlan ? 8 : 0));
  if (score >= 70) return { key: 'thriving', score, title: '2040: Nefes Alan Şehir', text: 'Gölgeli sokaklar, kesintisiz okul, temiz kıyı. Herkes her şeyi çözmedi; ama şehir krizlere birlikte hazırlanmayı öğrendi. 2040’taki öğrenci teşekkür ediyor: “Gelecek hâlâ yazılıyor, ama artık birlikte yazıyoruz.”' };
  if (score >= 50) return { key: 'transition', score, title: '2040: Dönüşümdeki Şehir', text: 'Bazı mahalleler hazır, bazıları hâlâ risk altında. Kararların iz bıraktı; eksik kalan alanlar seni bekliyor. Göstergelere bak ve yeniden dene: farklı yollar farklı gelecekler kurar.' };
  return { key: 'fragile', score, title: '2040: Kırılgan Şehir', text: 'Sıcak günler ve kesintiler hâlâ zorluyor. Bu bir son değil, bir uyarı: hangi kararlar dengeyi bozdu? Günlüğe bak, farklı kararları dene. Gelecek henüz kesinleşmedi.' };
}

/** Ön/son değerlendirme: modül başına 4 kavram sorusu. Doğru seçenek indeksi `answer`. */
export type AssessmentQ = { id: string; outcome: string; q: string; options: string[]; answer: number };
export const ASSESSMENTS: Record<ModuleId, AssessmentQ[]> = {
  energy: [
    { id: 'en-q1', outcome: 'EN1', q: 'Güneş paneli en çok ne zaman üretir?', options: ['Gece', 'Öğle saatlerinde, açık havada', 'Her saatte aynı', 'Yalnızca rüzgârlı günlerde'], answer: 1 },
    { id: 'en-q2', outcome: 'EN2', q: 'Batarya bir enerji sisteminde ne işe yarar?', options: ['Enerji üretir', 'Fazla enerjiyi saklayıp sonra kullanmayı sağlar', 'Talebi artırır', 'Şebekeyi kapatır'], answer: 1 },
    { id: 'en-q3', outcome: 'EN2', q: 'Aşağıdakilerden hangisi talebi azaltır?', options: ['Yeni güneş paneli', 'LED aydınlatma ve yalıtım', 'Daha büyük jeneratör', 'Daha uzun kablo'], answer: 1 },
    { id: 'en-q4', outcome: 'EN3', q: 'Yalnızca güneşe dayanan, depolaması olmayan bir sistemin riski nedir?', options: ['Gece ve bulutlu havada açık kalabilir', 'Hiç riski yoktur', 'Çok fazla enerji üretir', 'Bütçeyi artırır'], answer: 0 },
  ],
  carbon: [
    { id: 'ca-q1', outcome: 'CA1', q: 'Yaşam döngüsü analizi hangi aşamaları kapsar?', options: ['Yalnızca taşıma', 'Hammadde, üretim, taşıma, kullanım ve atık', 'Yalnızca ambalaj', 'Yalnızca satış'], answer: 1 },
    { id: 'ca-q2', outcome: 'CA2', q: '“%100 doğa dostu” yazan ama kaynak göstermeyen bir ürün için en iyi yaklaşım?', options: ['Hemen güvenmek', 'Kanıt ve bağımsız kaynak aramak', 'Ambalaj rengine bakmak', 'Fiyatına bakmak'], answer: 1 },
    { id: 'ca-q3', outcome: 'CA3', q: 'Kumaşı sağlam ama fermuarı bozuk bir çanta için en düşük kaynak kullanan seçenek?', options: ['Yenisini almak', 'Onarmak', 'Atmak', 'İki yeni çanta almak'], answer: 1 },
    { id: 'ca-q4', outcome: 'CA2', q: '“Rakibinden %50 daha az” iddiasında eksik olan bilgi nedir?', options: ['Ürünün rengi', 'Neye göre ve nasıl ölçüldüğü', 'Mağaza adı', 'Hiçbir şey'], answer: 1 },
  ],
  city: [
    { id: 'ci-q1', outcome: 'CI1', q: 'Sıcak hava dalgasında şehirleri doğal olarak serinleten önlem hangisi?', options: ['Daha çok beton', 'Ağaç ve gölgelik', 'Daha geniş yol', 'Otopark'], answer: 1 },
    { id: 'ci-q2', outcome: 'CI1', q: 'Sızdırmaz (beton, asfalt) yüzey artınca taşkın riski ne olur?', options: ['Azalır', 'Artar', 'Değişmez', 'Sıfırlanır'], answer: 1 },
    { id: 'ci-q3', outcome: 'CI3', q: 'İklim riskleri tüm mahalleleri eşit etkiler mi?', options: ['Evet, her zaman', 'Hayır; yoğun, gölgesiz ve dere kenarı mahalleler daha çok etkilenebilir', 'Yalnızca zengin mahalleleri etkiler', 'Riskler yalnızca kırsalda vardır'], answer: 1 },
    { id: 'ci-q4', outcome: 'CI2', q: 'Uyum bütçesini dağıtırken en iyi yöntem hangisi?', options: ['En görünür projeye vermek', 'Risk ve kanıta göre öncelik vermek', 'Kura çekmek', 'Hiç harcamamak'], answer: 1 },
  ],
  food: [
    { id: 'fo-q1', outcome: 'L1', q: 'Gıda israfı hangi kaynakların da boşa gitmesine yol açar?', options: ['Yalnızca yemeğin', 'Su, enerji, emek ve bütçenin', 'Hiçbirinin', 'Yalnızca ambalajın'], answer: 1 },
    { id: 'fo-q2', outcome: 'FO3', q: 'Gıda kaybı ile gıda israfı arasındaki fark nedir?', options: ['Fark yoktur', 'Kayıp üretim/tedarik zincirinde, israf tüketimde olur', 'İsraf yalnızca tarlada olur', 'Kayıp yalnızca evde olur'], answer: 1 },
    { id: 'fo-q3', outcome: 'FO2', q: 'Kuraklıkta suyu en verimli kullanan sulama yöntemi hangisi?', options: ['Salma sulama', 'Damla sulama', 'Gün ortasında yağmurlama', 'Sulamayı artırmak'], answer: 1 },
    { id: 'fo-q4', outcome: 'L1', q: 'Artan temiz yemek için en yüksek değeri koruyan seçenek?', options: ['Çöpe atmak', 'Güvenli şekilde insanlarla paylaşmak', 'Yakmak', 'Gömmek'], answer: 1 },
  ],
  ocean: [
    { id: 'oc-q1', outcome: 'OC1', q: 'Denizdeki plastiğin önemli bir kısmı nereden gelir?', options: ['Yalnızca gemilerden', 'Karadan, derelerden ve kötü atık yönetiminden', 'Denizin dibinden', 'Yağmurdan'], answer: 1 },
    { id: 'oc-q2', outcome: 'OC2', q: 'Deniz ısınırken ekosistemi korumaya yardım eden adım hangisi?', options: ['Diğer baskıları (kirlilik, demirleme) azaltmak', 'Hiçbir şey', 'Daha çok avlanmak', 'Kıyıyı betonla kaplamak'], answer: 0 },
    { id: 'oc-q3', outcome: 'OC3', q: 'Koruma alanının etkisi ne zaman görülür?', options: ['Hemen ertesi gün', 'Çoğu zaman yıllar içinde ve izlemeyle', 'Hiçbir zaman', 'Tabela koyunca'], answer: 1 },
    { id: 'oc-q4', outcome: 'OC3', q: 'Başarılı bir koruma planı için hangisi önemlidir?', options: ['Paydaşlarla birlikte planlamak ve denetlemek', 'Yalnızca tabela', 'Gizli tutmak', 'Kimseye sormamak'], answer: 0 },
  ],
  waste: [
    { id: 'wa-q1', outcome: 'WA1', q: 'Atık hiyerarşisinin en üst basamağı nedir?', options: ['Geri dönüşüm', 'Önleme', 'Yakma', 'Depolama'], answer: 1 },
    { id: 'wa-q2', outcome: 'WA2', q: 'Geri dönüşüm kutusuna yemek artığı karışırsa ne olur?', options: ['Daha iyi dönüşür', 'Malzeme kirlenir, geri dönüşüm zorlaşır', 'Fark etmez', 'Kompost olur'], answer: 1 },
    { id: 'wa-q3', outcome: 'WA1', q: 'Bozuk bir eşya için hiyerarşiye en uygun ilk adım?', options: ['Atmak', 'Onarmayı denemek', 'Yakmak', 'Saklamak'], answer: 1 },
    { id: 'wa-q4', outcome: 'WA3', q: 'Uzun vadede atık yönetim maliyetini en çok düşüren yaklaşım?', options: ['Daha sık toplamak', 'Atığı kaynağında önlemek', 'Bütçeyi kesmek', 'Daha büyük çöp kutusu'], answer: 1 },
  ],
  council: [
    { id: 'co-q1', outcome: 'CO1', q: 'İyi bir iklim kararı için hangisi gereklidir?', options: ['Yalnızca bir grubu dinlemek', 'Farklı grupların ihtiyaçlarını kanıtla karşılaştırmak', 'En yüksek sesi dinlemek', 'Kararı ertelemek'], answer: 1 },
    { id: 'co-q2', outcome: 'CO2', q: 'Bir kararı savunurken en güçlü dayanak hangisidir?', options: ['Kişisel görüş', 'Ölçülmüş ve kaynağı belli kanıt', 'Söylenti', 'Reklam'], answer: 1 },
    { id: 'co-q3', outcome: 'CO3', q: 'İklim önlemlerini ertelemek genellikle ne sonuç verir?', options: ['Maliyeti ve riski artırabilir', 'Her zaman ucuzlatır', 'Etkisi yoktur', 'Sorunu çözer'], answer: 0 },
    { id: 'co-q4', outcome: 'L3', q: 'Tek bir göstergeyi en yükseğe çıkarmak neden yetmeyebilir?', options: ['Diğer alanlarda zarar yaratabilir', 'Her zaman yeterlidir', 'Göstergeler önemsizdir', 'Bütçe sınırsızdır'], answer: 0 },
  ],
};
export function scoreAssessment(moduleId: ModuleId, answers: Record<string, number>) {
  const qs = ASSESSMENTS[moduleId];
  const correct = qs.filter((q) => answers[q.id] === q.answer).length;
  return { correct, total: qs.length, pct: Math.round((100 * correct) / qs.length) };
}

/** Gerçek dünya etkinlikleri (öğretmen atar; sonuçlar "Ölçülmüş" etiketiyle kaydedilir). */
export const REAL_WORLD_TASKS = [
  { key: 'food-waste', title: 'Okulun gıda atığını ölçme', unit: 'kg/gün', module: 'food' },
  { key: 'energy-watch', title: 'Enerji tasarrufu gözlemi (boşken açık cihaz)', unit: 'adet', module: 'energy' },
  { key: 'reuse', title: 'Yeniden kullanım etkinliği (onarılan/paylaşılan eşya)', unit: 'adet', module: 'waste' },
  { key: 'water', title: 'Su tüketimi farkındalığı (sayaç okuması)', unit: 'm³/hafta', module: 'city' },
  { key: 'shade', title: 'Gölgelik ve yeşil alan incelemesi (gölgede/güneşte sıcaklık farkı)', unit: '°C', module: 'city' },
  { key: 'sorting', title: 'Atık ayrıştırma gözlemi (yanlış atılan parça)', unit: 'adet', module: 'waste' },
  { key: 'consumption', title: 'Bilinçli tüketim araştırması (kanıtlı çevreci iddia)', unit: 'adet', module: 'carbon' },
] as const;
