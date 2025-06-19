
# Remote Manager - Uzaktan İzleme ve Yönetim Aracı

Bu proje, bilgisayarları uzaktan izlemek, yönetmek ve çeşitli otomasyon görevlerini çalıştırmak için geliştirilmiş bir RMM (Remote Monitoring and Management) aracı prototipidir. Uygulama, modern web teknolojileri kullanılarak oluşturulmuştur ve yapay zeka destekli script oluşturma gibi yenilikçi özellikler sunmayı hedefler.

## ✨ Temel Özellikler

- **Bilgisayar Yönetimi:** Bağlı bilgisayarları listeleme, detaylarını görüntüleme ve (mock data üzerinden) yeni bilgisayar ekleme.
- **Grup Yönetimi:** Bilgisayarları mantıksal gruplar altında organize etme, gruplara özel prosedür ve monitör atama.
- **Prosedür Yönetimi:**
    - Özel script'ler (CMD, PowerShell, Python) oluşturma, düzenleme ve çalıştırma.
    - Sistem prosedürleri (Windows Güncelleme, Yazılım Güncelleme - winget) tanımlama ve yönetme.
    - Prosedürleri belirli bilgisayarlarda veya gruplarda çalıştırma ve sonuçlarını izleme.
- **Monitör Yönetimi:**
    - Sistem durumlarını (CPU, disk vb.) veya özel koşulları izlemek için monitör script'leri oluşturma ve düzenleme.
    - Monitörleri gruplara atayarak otomatik izleme sağlama (simüle edilmiş).
- **Özel Komut Çalıştırma:** Belirli bilgisayarlara veya gruplara anlık özel komutlar gönderme.
- **Yazılım Lisans Takibi:** Üçüncü parti yazılımların lisanslarını (ürün adı, adet, bitiş tarihi vb.) takip etme.
- **Sistem Lisans Yönetimi:** Uygulamanın kendi kullanım lisansını (PC sayısı, geçerlilik süresi) simüle etme ve yönetme.
- **Yapay Zeka Entegrasyonu (Genkit ile):**
    - Doğal dil açıklamalarından script'ler (PowerShell, CMD, Python) oluşturma.
    - Mevcut prosedür script'lerini analiz ederek güvenlik ve verimlilik iyileştirmeleri önerme.
- **Kullanıcı Arayüzü:**
    - Aydınlık/Karanlık Mod desteği.
    - Duyarlı tasarım ve katlanabilir kenar çubuğu ile kolay navigasyon.
    - ShadCN UI bileşenleri ile modern ve temiz arayüz.

## 🛠️ Kullanılan Teknolojiler

- **Frontend:**
    - **Next.js (App Router):** React tabanlı web uygulamaları için framework.
    - **React:** Kullanıcı arayüzleri oluşturmak için JavaScript kütüphanesi.
    - **TypeScript:** JavaScript'e statik tipleme ekleyen dil.
    - **ShadCN UI:** Yeniden kullanılabilir ve erişilebilir UI bileşenleri.
    - **Tailwind CSS:** Hızlı UI geliştirmesi için yardımcı program öncelikli CSS framework'ü.
    - **Lucide React:** İkon kütüphanesi.
- **Backend (Simülasyon):**
    - **Mock Data (`src/lib/mockData.ts`):** Şu anki geliştirme aşamasında backend işlevlerini simüle etmek için kullanılmaktadır. Veriler tarayıcı belleğinde tutulur ve kalıcı değildir.
- **Yapay Zeka:**
    - **Genkit (Google AI):** AI destekli özellikler (script oluşturma, iyileştirme) için kullanılan framework.

## 🚀 Başlarken

### Ön Gereksinimler

- Node.js (LTS sürümü önerilir)
- npm veya yarn

### Kurulum

1.  Projeyi klonlayın:
    ```bash
    git clone <proje_repository_url>
    cd <proje_dizini>
    ```
2.  Gerekli bağımlılıkları yükleyin:
    ```bash
    npm install
    # veya
    yarn install
    ```

### Geliştirme Sunucusunu Çalıştırma

Uygulamayı geliştirme modunda çalıştırmak için:

```bash
npm run dev
```

Bu komut genellikle `http://localhost:3000` adresinde geliştirme sunucusunu başlatacaktır.

### Genkit Geliştirme Sunucusunu Çalıştırma (Yapay Zeka Akışları İçin)

Yapay zeka akışlarını (`src/ai/flows/`) test etmek ve geliştirmek için ayrı bir Genkit sunucusunu çalıştırmanız gerekebilir:

```bash
npm run genkit:dev
# veya değişiklikleri izlemek için:
npm run genkit:watch
```

Bu komut, Genkit geliştirme kullanıcı arayüzünü (genellikle `http://localhost:4000`) ve akışlarınız için API endpoint'lerini başlatır.

### Prodüksiyon Derlemesi ve Çalıştırma

Uygulamayı prodüksiyon için derlemek:

```bash
npm run build
```

Derlenmiş uygulamayı çalıştırmak:

```bash
npm run start
```

## 📁 Proje Yapısı (Önemli Klasörler)

-   `src/app/`: Next.js App Router kullanılarak oluşturulan sayfalar ve rota grupları. Her klasör genellikle bir URL segmentine karşılık gelir.
-   `src/components/`:
    -   `ui/`: ShadCN UI tarafından sağlanan temel UI bileşenleri (Button, Card, Input vb.).
    -   Diğer alt klasörler: Uygulamaya özel, yeniden kullanılabilir React bileşenleri (örn: `ComputerTable`, `AppLayout`).
-   `src/lib/`:
    -   `mockData.ts`: Uygulamanın backend'ini simüle eden, örnek verileri ve veri işleme mantığını içeren dosya.
    -   `utils.ts`: Yardımcı fonksiyonlar (örn: `cn` class birleştirme).
-   `src/ai/`:
    -   `genkit.ts`: Genkit'in temel yapılandırması.
    -   `flows/`: Genkit kullanılarak tanımlanmış yapay zeka akışları (örn: script oluşturma, prosedür iyileştirme).
-   `src/contexts/`: Uygulama genelinde paylaşılan state'leri yönetmek için React Context'leri (örn: `LicenseContext`).
-   `src/hooks/`: Özel React hook'ları (örn: `useToast`, `useLicense`).
-   `src/types/`: Uygulamada kullanılan TypeScript arayüzleri ve tipleri.
-   `public/`: Statik dosyalar (resimler, fontlar vb.).
-   `package.json`: Proje bağımlılıkları ve script'leri.
-   `tailwind.config.ts`: Tailwind CSS yapılandırması.
-   `next.config.ts`: Next.js yapılandırması.
-   `tsconfig.json`: TypeScript yapılandırması.

## 📜 Kullanılabilir Script'ler

`package.json` dosyasında tanımlanmış başlıca script'ler:

-   `npm run dev`: Geliştirme sunucusunu başlatır.
-   `npm run build`: Prodüksiyon için uygulamayı derler.
-   `npm run start`: Derlenmiş prodüksiyon uygulamasını başlatır.
-   `npm run lint`: ESLint ile kod stilini kontrol eder.
-   `npm run typecheck`: TypeScript ile tip kontrolü yapar.
-   `npm run genkit:dev`: Genkit geliştirme sunucusunu başlatır.
-   `npm run genkit:watch`: Genkit geliştirme sunucusunu izleme modunda başlatır.

## 🤖 Yapay Zeka Entegrasyonu

Uygulama, **Genkit** framework'ünü kullanarak Google AI modelleri ile etkileşim kurar. Bu entegrasyon, aşağıdaki gibi özellikler sunar:

-   **Script Oluşturma:** Kullanıcıların doğal dilde verdiği komutlardan (`CMD`, `PowerShell`, `Python`) script'ler üretilir.
-   **Prosedür İyileştirme:** Mevcut script'ler ve (isteğe bağlı) çalıştırma logları analiz edilerek güvenlik ve verimlilik açısından iyileştirilmiş script önerileri sunulur.

Bu özellikler, `src/ai/flows/` klasöründeki Genkit akışları aracılığıyla yönetilir.

## 📄 Lisans

Bu proje şu anda aktif geliştirme aşamasındadır. Resmi bir sürüm yayınlandığında lisans koşulları belirlenecektir.

(Eğer açık kaynak yapmayı düşünüyorsanız: Örn: Bu proje MIT Lisansı altındadır. Detaylar için `LICENSE` dosyasına bakınız.)

## 🤝 Katkıda Bulunma

Katkılarınız her zaman beklerim! Lütfen bir "issue" açın veya bir "pull request" gönderin.

## 💡 Gelecek Planları ve Fikirler

Bu bir prototip olup, gelecekte aşağıdaki gibi özelliklerle geliştirilebilir:

-   Gerçek bir backend ve veritabanı entegrasyonu.
-   Yönetilecek bilgisayarlara kurulacak bir RMM ajanı (agent) geliştirilmesi.
-   Gerçek zamanlı veri akışı ve komut iletimi için WebSocket kullanımı.
-   Kapsamlı kullanıcı yönetimi ve rol bazlı erişim kontrolü (RBAC).
-   Detaylı raporlama ve analiz özellikleri.
-   Üçüncü parti entegrasyonları (örn: bildirim sistemleri, ticket sistemleri).
-   Daha gelişmiş güvenlik özellikleri (2FA, denetim kayıtları vb.).

---

Bu README dosyasının, projenize yeni başlayanlar veya katkıda bulunmak isteyenler için iyi bir başlangıç noktası olacağını umuyorum!
