# DESIGN.md — Panduan Gaya Brevet Learning System (BLS)

Pegangan untuk mengubah halaman atau menambah fitur agar tampil seragam dengan gaya saat ini
(tatanan ala Coretax, gaya visual **"Emerald × lime fintech"** — bersih ala Wise/Revolut, beridentitas BLS).
Tatanan (header kaca, menu horizontal + mega menu, sidebar kartu, breadcrumb) sama dengan taxlearning/taxmateschool;
yang membedakan BLS adalah warna emerald + lime, font Manrope, bentuk pil, dan tabel berheader terang.

Stack UI: Laravel 11 + Inertia React + TypeScript + Tailwind 3.4 + shadcn/ui.

---

## 1. Prinsip

1. **Identitas BLS.** Pakai logo & nama Brevet Learning System. Jangan pakai logo/nama Coretax, DJP, Kemenkeu, atau nama CV/PT.
2. **Fitur tidak dikurangi.** Perubahan tampilan tidak boleh mengubah logika, validasi, atau alur.
3. **Token dulu.** Warna lewat token semantik (`bg-card`, `text-muted-foreground`, `bg-brand`, …), bukan kelas warna mentah (`bg-gray-100`, `bg-blue-950`).
4. **Mode gelap wajib.** Setiap elemen baru harus terbaca di terang dan gelap. Kalau sudah pakai token, mode gelap otomatis ikut.
5. **Flat.** Tanpa bayangan sama sekali. Pemisah antar permukaan cukup dengan beda latar (`page` vs `card`) dan garis rambut `border-border/80`.
   Semua utilitas `shadow-*` (termasuk arbitrary) dinetralkan global di `app.css` lewat `--tw-shadow`, jadi menambah `shadow-…` tidak berefek.
6. **Ringan.** Tanpa animasi berulang atau blur besar. Animasi cukup opacity/transform singkat (≤ 300 ms).
7. **HP dulu dicek.** Tidak boleh ada scroll horizontal halaman pada lebar 375 px (tabel boleh scroll di dalam kartunya sendiri).

---

## 2. Warna & token

Didefinisikan di `resources/css/app.css` (`:root, .light` dan `.dark`) dan didaftarkan di `tailwind.config.js`.

### Identitas
| Nilai | Hex | Catatan |
|---|---|---|
| Emerald tua | `#0D4D40` | warna utama (tombol utama, item sidebar aktif, kartu angka utama) |
| Lime | `#C5F24A` | sorotan: menu aktif, tombol `highlight`, lencana tren, label di kartu emerald |
| Teks di atas lime | `#0D3B30` | `highlight-foreground` |
| Lime muda / teks | `#ECFCCB` / `#3F6212` | lencana status positif (Approved, Aktif, Lulus) |
| Latar halaman | `#F5F7F4` | putih keabu-hijauan; kartu tetap putih |

Kuning/emas lama sudah tidak dipakai. `yellow-400/500` di `tailwind.config.js` dipetakan ke lime agar halaman lama ikut.

### Token semantik
| Token (kelas Tailwind) | Terang | Gelap | Kapan dipakai |
|---|---|---|---|
| `background` / `foreground` | `#F9FAF8` / `#10201C` | hitam kehijauan / putih 94% | latar & teks utama |
| `page` | `#F5F7F4` | `#0B0F0E` | latar halaman di balik kartu |
| `card` / `card-foreground` | putih | `#151A18` | permukaan kartu, input, popover |
| `muted` / `muted-foreground` | abu-hijau 95% / `#5E6E68` | abu 13% / abu 64% | latar lembut, teks sekunder, label |
| `border` / `input` | `#E3E8E1` / abu-hijau 85% | abu 17% / 22% | garis tipis kartu / garis input |
| `primary` / `primary-foreground` | emerald tua / putih | **lime / hijau tua** | tombol utama, link aksi |
| `secondary`, `accent` | abu-hijau lembut | abu 15–16% | tombol sekunder, hover |
| `highlight` / `highlight-foreground` / `highlight-soft` | lime / `#0D3B30` / `#ECFCCB` | lime / hijau tua / lime redup | menu aktif, sorotan, filter aktif |
| `brand` / `brand-foreground` | emerald tua / putih | **tetap emerald tua** / putih | kartu angka utama, header dialog, item sidebar aktif |
| `brand-ink` | emerald tua | putih kehijauan | teks berwarna brand (judul kecil, angka) |
| `steel` / `steel-foreground` | abu-hijau 44% / putih | abu 36% / putih | lencana netral (draft) |
| `success` | `#3F6212` (olive-lime) | lime 60% | berhasil, disetujui |
| `warning` | `#B9580A` | oranye 54% | dibatalkan, perhatian |
| `destructive` | `#DC2626` | merah 51% | hapus, error validasi, tanda wajib `*` |
| `info` | biru laut 34% | biru langit 56% | informasi, status dibuat |

Radius dasar `--radius` = 16px. `--card-shadow` dan `--primary-shadow` = `none` (flat).

Setiap token latar punya pasangan `*-foreground` untuk teks di atasnya. **Kalau memberi `bg-success`, beri juga `text-success-foreground`** (dst).

### Aturan pakai
- Perlu forest emerald yang **tetap forest emerald** di mode gelap → `bg-brand`. Perlu tombol utama → pakai `<Button>` varian default (bukan `bg-brand`).
- Teks sekunder/label → `text-muted-foreground`. Jangan `text-gray-500`.
- Garis → `border-border` (kartu) atau `border-input` (field).
- Kelas warna mentah lama yang masih tersisa (mis. `bg-emerald-100 text-emerald-700`) ditangani **jembatan mode gelap**
  di `app.css`. Jangan menambah kelas mentah baru; kalau terpaksa, tambahkan varian `dark:`.

---

## 3. Tipografi

- Font: **Manrope** (semua teks; dimuat dari fonts.bunny.net di `resources/views/app.blade.php`). Sengaja beda dari Plus Jakarta Sans milik taxlearning.
- Angka **tabular** di seluruh aplikasi (`font-feature-settings: "tnum"` di `body`) agar nominal & NPWP rata.
- Judul halaman: `text-2xl font-semibold text-primary`, **tanpa ikon** (sudah di `PageHeader` & `FormPageHeader`). Semua halaman sama.
- Judul kartu: `text-sm md:text-base font-bold` (sudah di `tls-card-head`).
- Label form: `text-sm font-medium`; nilai detail: `text-sm font-semibold text-foreground`.
- Header tabel: kapital kecil `text-[11px]` semibold, abu (`muted-foreground`) di atas latar abu sangat terang (otomatis lewat `TableHeader`).

---

## 4. Layout halaman

| Layout | Untuk |
|---|---|
| `Layouts/AuthenticatedLayout.tsx` | Semua halaman siswa/wajib pajak. Header kaca, menu horizontal + mega menu, sidebar kartu per modul, breadcrumb otomatis, footer |
| `AuthenticatedLayout variant="home"` | Halaman tanpa sidebar (Beranda) |
| `Layouts/AdminLayout.tsx`, `TeacherLayout.tsx` | Panel admin & pengajar (memakai `Components/app-shell/StaffShell.tsx`) |
| `Layouts/HeaderOnlyLayout.tsx` | Detail / pengerjaan / hasil ujian |
| `Layouts/GuestLayout.tsx` | Halaman tamu (daftar, dll). Dipaksa terang |
| `Components/auth/AuthShell.tsx` | Bingkai halaman auth. Latar polos `bg-page` (tanpa dekorasi kaca). Prop `bare` = tanpa header/footer bawaan |

**Halaman tamu bergaya login** memakai `Components/auth/AuthSplit.tsx`:
- `AuthSplit` = tata letak dua panel (dipakai **Login** dan **Lupa Kata Sandi**). Konten kanan cukup diisi judul + form.
- Ekspor pendukung: `GuestTopBar` (logo + tema/bahasa + aksi), `BlsLogo`, `FlatShapes` (lingkaran lime dekoratif di blok emerald),
  `BLS_FEATURES`, `COPYRIGHT`, `authFieldInput` / `authFieldIcon` (input h-12 berikon).
- **Apa itu BLS** (`Pages/Auth/About.tsx`): `GuestTopBar` + tombol "Masuk", hero emerald, 4 kartu navigasi cepat ke tiap fitur,
  kartu detail fitur (2 poin + tangkapan layar), "Tentang Platform", dan CTA emerald. Konten disimpan sebagai array di atas file.

**Halaman login** (`Pages/Auth/Login.tsx`, juga di `/`): langsung form, **tanpa halaman sambutan**. Desktop (`lg`) terbagi dua:
kiri panel emerald flat (logo putih, lencana lime, judul "Belajar pajak, *siap praktik.*" dengan aksen lime, 4 kartu modul,
hak cipta), kanan form selebar 400px (judul, keterangan bahwa akun dibuat admin/pengajar, Email, Kata Sandi dengan
"Lupa kata sandi?" sejajar label, tombol pil "Masuk", kotak tips keamanan, tautan "Apa itu BLS?"). HP/tablet: panel
emerald disembunyikan, logo + kontrol tema/bahasa di bar atas. Tidak ada tombol daftar (akun dikelola admin/pengajar).

- Menu & hak akses diatur di **satu tempat**: `Components/app-shell/nav-config.ts` (`NAV_MODULES`). Menambah menu = menambah item di sana.
- Pembungkus pertama isi halaman sebaiknya `<div>`; aturan `.app-content > div` memberi jarak tepi otomatis
  (12 px di HP, 24 px di desktop). Jangan pakai `max-w-*` sempit untuk pembungkus halaman.
- Breadcrumb: kalau halaman tidak membuat breadcrumb sendiri, layout membuatkannya. Format seragam:
  **`Dashboard > [modul] > Halaman`**, teks "Dashboard" tanpa ikon. Modul "Portal Saya" tidak ditampilkan
  (Dashboard > Kelas Saya). Breadcrumb buatan halaman juga mulai dari "Dashboard", bukan "Beranda".
  Breadcrumb otomatis memakai padding yang sama dengan konten (12px HP / 24px desktop) dan jarak 16px ke
  judul (`.app-content[data-auto-crumb]`), jadi posisinya identik dengan breadcrumb buatan halaman.
  Pembungkus kedua halaman lama (`flex flex-col … px-4` / `p-4`) dinolkan padding sampingnya agar judul
  sejajar breadcrumb — jangan menambah padding samping sendiri di pembungkus halaman.
- Menu atas aktif (juga StaffShell admin/pengajar): **pil lime** (`rounded-full bg-highlight text-highlight-foreground`), juga di mode gelap.
- Item mega menu aktif: `bg-highlight-soft text-highlight-foreground` (gelap: `bg-highlight/15 text-highlight`).
- Item sidebar aktif: **blok emerald tua `bg-brand text-white` membulat `rounded-xl`** (gelap: blok lime dengan teks hijau tua).
  Tidak ada lagi border kiri kuning.
- Kotak cari header & kotak cari toolbar tabel berbentuk pil.

---

## 5. Komponen inti

### Kartu
Kelas di `app.css`:

| Kelas | Isi |
|---|---|
| `tls-card` | kartu utama: `rounded-2xl` (16px), garis `border-border/80`, latar putih, tanpa bayangan |
| `tls-card-hover` | hover kartu yang bisa diklik: garis berubah ke `primary/30` (tanpa angkat/bayangan) |
| `tls-card-head` | kepala kartu: flex, ikon + judul, garis bawah, `px-5 py-4` |
| `tls-stat` | kotak angka/statistik kecil (tanpa border, latar `muted`) |
| `tls-panel` | panel lembut di dalam kartu |

Kartu angka utama: `StatTile` **pertama** di dalam `StatGrid` otomatis jadi blok emerald tua dengan label & ikon lime
(kelas `tls-stat-grid > .tls-stat-tile:first-child` di `app.css`). Taruh angka terpenting di urutan pertama.
`EntityCard` tidak lagi memakai aksen kiri berwarna; status ditunjukkan lewat `StatusPill`.

```tsx
<section className="tls-card">
    <div className="tls-card-head"><FileText className="size-4" /> Judul</div>
    <div className="p-4 md:p-6">…</div>
</section>
```

### Halaman form & detail — `Components/app-shell/FormPage.tsx`
```tsx
import { FormActions, FormPageHeader, FormSection } from "@/Components/app-shell/FormPage";

<FormPageHeader
    title="Buat eBupot BPPU"
    description="opsional"
    backHref={route("bppu.notIssued")}      // tombol Kembali di kanan
    actions={<Button>Edit</Button>}          // aksi lain di kanan (halaman detail)
/>
<form onSubmit={…}>
    <FormSection icon={<File />} title="Informasi Umum">
        {/* field */}
    </FormSection>
    <FormActions cancelHref={route("bppu.notIssued")}>  {/* Batal (outline) otomatis */}
        <Button type="submit">Simpan</Button>
    </FormActions>
</form>
```
- Baris field: label kiri, input kanan di desktop; bertumpuk di HP:
  `FormItem className="flex flex-col gap-1 md:flex-row md:items-center md:gap-4"` + `FormLabel className="md:w-1/4"`.
- Tombol aksi selalu di bawah, rata kanan; tombol utama paling kanan.
- Halaman detail: `ItemDetail` (`Components/layout/ItemDetail.tsx`) untuk baris label–nilai.

### Tombol — `Components/ui/button.tsx`
| Varian | Pakai untuk |
|---|---|
| `default` | aksi utama (emerald tua; lime di gelap) |
| `gradient` | CTA sangat penting saja (login, simpan final) |
| `outline` | Batal, Kembali, tombol alat tabel |
| `secondary`, `ghost`, `link` | aksi ringan |
| `destructive` | hapus / batalkan |
| `highlight` | sorotan lime (refresh, filter aktif) |
| `success` | konfirmasi positif |

Semua tombol berbentuk **pil** (`rounded-full`). Jangan menimpa warna tombol dengan `className="bg-…"`; pilih varian.

### Lencana — `Components/ui/badge.tsx`
Varian: `default`, `secondary`, `destructive`, `outline`, `success` (lime muda `#ECFCCB` / teks `#3F6212`), `warning`, `info` (lembut), `highlight`.
Untuk status di halaman baru utamakan lencana pil lembut (`StatusPill` / `Badge variant="success"`); `toneFromStatus` memetakan label ke nada.
Lencana status solid di tabel (pola `colorClass`):

| Status | Kelas |
|---|---|
| dibuat | `bg-info text-info-foreground hover:bg-info/90` |
| disetujui | `bg-success text-success-foreground hover:bg-success/90` |
| dibatalkan | `bg-warning text-warning-foreground hover:bg-warning/90` |
| dihapus | `bg-destructive text-destructive-foreground hover:bg-destructive/90` |
| draft / lainnya | `bg-steel text-steel-foreground hover:bg-steel/90` |

### Input & select
Pakai `Components/ui/{input,select,textarea,checkbox}` apa adanya (sudah bertoken). `Input` `rounded-xl`, cincin fokus lime. Field nonaktif tetap memakai `disabled`.
Error validasi: `FormMessage` (otomatis `text-destructive`); tanda wajib: `<span className="text-destructive">*</span>`.

---

### Kit halaman kelas, ujian, pengajar & admin — `Components/app-shell/kit.tsx`
Dipakai di Kelas Saya, Ujian Saya, Deskripsi/Hasil Ujian, Detail Kelas siswa, semua halaman daftar & detail
pengajar (Dashboard, Daftar Kelas, Daftar Ujian, Bank Soal, Soal Bank, Detail Kelas/Ujian), dan admin
(Dashboard, Daftar Kelas/Ujian, Detail Kelas/Ujian pengajar, Detail Pengguna, Platform).

| Komponen | Pakai untuk |
|---|---|
| `PageHeader` | Judul halaman polos (tanpa ikon) + deskripsi + aksi kanan — sama dengan `FormPageHeader` |
| `StatGrid` + `StatTile` | Angka ringkas berikon dan bernada warna (2 kolom di HP, 4 di desktop; ikon di atas label di HP) |
| `EntityCard` | Kartu kelas/ujian/bank soal: **aksen kiri 4px sesuai status**, ikon, judul, subjudul, lencana kanan, isi, baris aksi berlatar `bg-muted/30` |
| `MetaGrid` | Kotak-kotak meta kecil (ikon + label kapital + nilai) di dalam kartu |
| `Timeline` | Bar progres waktu mulai → selesai + persen (dihitung dari tanggal yang sudah ada) |
| `InfoGrid` | Pengganti tabel "Label : nilai" — grid 2 kolom berikon, `full` untuk baris lebar penuh |
| `Section` | Kartu bagian dengan kepala berikon, deskripsi, aksi |
| `StatusPill` / `Chip` | Lencana status bertitik / lencana lembut berikon (modul, jadwal, akses materi) |
| `CodeChip` | Kode kelas/ujian yang bisa disalin |
| `Notice` | Pesan dalam kartu (info, peringatan remedial, dsb) beraksen kiri |
| `EmptyState` | Keadaan kosong berikon + tombol aksi |
| `toneFromStatus(label)` | Ubah label status ("Sedang Berlangsung", "Selesai", "Lulus", …) jadi nada warna |
| `fmtDate(v, withTime?)` | Tanggal singkat Indonesia (14 Nov 2026, 13.00) |

Nada warna (`Tone`): `brand`, `info`, `success`, `warning`, `destructive`, `steel`, `highlight`.
Pemetaan status: berlangsung/aktif/lulus → `success`, belum mulai → `info`, selesai/nonaktif → `steel`,
gagal/tidak lulus → `destructive`, remedial/batal → `warning`.

**Hero forest emerald** untuk halaman detail utama siswa (Deskripsi Ujian, Detail Kelas): `section` `bg-brand
text-brand-foreground rounded-2xl`, lingkaran dekoratif `bg-highlight/15`, tombol utama `variant="highlight"`,
deret meta `bg-white/10` dengan ikon `text-highlight`.

```tsx
<EntityCard
    tone={toneFromStatus(status.label)}
    icon={GraduationCap}
    title={course.name}
    subtitle={course.description}
    badges={<StatusPill tone={tone}>{status.label}</StatusPill>}
    actions={<Button asChild><Link href={…}><Eye />Lihat Detail</Link></Button>}
>
    <MetaGrid items={[{ icon: CalendarDays, label: "Mulai", value: fmtDate(course.start_date) }]} />
    <Timeline start={course.start_date} end={course.end_date} tone={tone} startLabel="Progres durasi kelas" />
</EntityCard>
```

Aturan aksi di kartu: tombol utama (`default`) paling kiri, lalu `outline` (Edit, Duplikat), dan **Hapus**
`variant="ghost"` merah di ujung kanan (`sm:ml-auto`).

## 6. Tabel

- Pakai `Components/ui/table.tsx`. `TableHeader` otomatis berlatar abu sangat terang `#F7F9F6` dengan teks abu kapital kecil (`.tls-thead`); baris dipisah garis tipis `border/60`, baris terpilih `highlight-soft`.
- Judul kolom yang bisa diurutkan: `DataTableColumnHeader` (`title="…"` — judul ini juga dipakai Atur Kolom & ekspor).
- Pagination: `DataTablePagination`.
- Toolbar (lihat `Components/layout/Invoice/data-table.tsx` sebagai contoh):

```tsx
import { DataTableViewOptions } from "../DataTableViewOption";
import { countTextFilters, DataTableExport, DataTableFilterRow, DataTableFilterToggle } from "../DataTableTools";

const [showColumnFilters, setShowColumnFilters] = React.useState(false);

<div className="tls-table-toolbar flex items-center py-4 gap-2">
    <Input placeholder="Cari…" className="max-w-sm" … />
    {/* DataTableFacetedFilter … */}
    <DataTableViewOptions table={table} />                       {/* Atur Kolom */}
    <DataTableFilterToggle
        active={showColumnFilters}
        onToggle={() => setShowColumnFilters((v) => !v)}
        activeCount={countTextFilters(table)}
    />
    <DataTableExport table={table} fileName="faktur-pajak" />    {/* CSV / Excel / PDF */}
</div>
…
<TableHeader>
    {/* baris judul */}
    {showColumnFilters && <DataTableFilterRow table={table} />}
</TableHeader>
```
- Kelas `tls-table-toolbar` wajib: membuat toolbar turun baris (tidak meluber) dan di HP kotak cari penuh satu baris.
- Tabel di dalam form (item faktur, lampiran SPT) tidak perlu toolbar alat.
- Tabel form SPT ber-`table-fixed` dengan lebar kolom tetap — **jangan** diubah ke `table-auto`.

---

## 7. Halaman SPT detail

- Pembungkus halaman diberi kelas **`tls-spt`**; gaya tab lampiran, kartu accordion, dan bar judul bagian diatur oleh CSS
  terlingkup di `app.css` (blok "Halaman detail SPT").
- Tab lampiran: `Tabs` + `TabsList` + `TabsTrigger` biasa — otomatis jadi pil (aktif lime dengan teks hijau tua, terang & gelap).
- Bagian form: `Accordion` + `AccordionItem` + `AccordionTrigger` biasa — otomatis jadi kartu dengan kepala abu terang (tanpa aksen kiri).
- Bar judul lepas: `div` dengan `bg-brand text-brand-foreground font-semibold` atau pola
  `bg-muted rounded-t-xl` (kepala) + `bg-card rounded-b-xl` (isi).
- Tombol "Bayar dan Lapor" di bagian pernyataan, rata kanan, di atas garis pemisah.

---

## 8. Mode gelap

- Kelas `dark` di `<html>`; disimpan di `localStorage` kunci `bls-theme` (`resources/js/lib/theme.ts` → `useTheme()`).
- Elemen di dalam `.light` dipaksa terang. Halaman tamu memakai `useForceLight()`.
- Varian Tailwind `dark:` sudah dikonfigurasi (`&:not(.light *):is(.dark *)`).
- Di mode gelap `primary` = lime; jangan menaruh teks `text-primary` di atas latar lime (pakai `text-highlight-foreground`).
- Elemen aktif berlatar lime yang punya `dark:hover:bg-white/5` harus juga diberi `dark:hover:bg-highlight` agar pil tidak hilang saat hover.
- Ikon `text-brand-900/950` di dalam `.bg-highlight` otomatis tetap hijau tua di mode gelap (aturan di `app.css`).

---

## 9. Responsif

| Breakpoint | Perilaku |
|---|---|
| < 640 px (HP) | baris label–input bertumpuk; tombol boleh turun baris; toolbar tabel: cari penuh satu baris, tombol alat ikon saja |
| ≥ 768 px | label kiri / input kanan |
| ≥ 1024 px | sidebar modul tampil; deretan tombol aksi boleh turun baris |

Cek setiap halaman baru di 375 px, 768 px, dan desktop.

---

## 10. CSS kustom — di mana & bagaimana

- Kelas komponen bersama (`tls-card` dkk) ada di `@layer components`.
- Aturan terlingkup (SPT, toolbar tabel, baris filter) ditulis **di luar `@layer`** di akhir `app.css`:
  di `@layer utilities` Tailwind bisa memangkas aturan yang kuncinya kelas kustom.
- Selektor yang bergantung pada kelas warna tulis dalam dua bentuk, mis. `:is(.bg-white, .bg-card)`.

---

## 11. Checklist halaman / fitur baru

- [ ] Memakai layout yang sesuai dan menu ditambahkan di `nav-config.ts` bila perlu.
- [ ] Judul memakai `FormPageHeader` (aksi di kanan).
- [ ] Bagian memakai `tls-card` / `FormSection` / `Section`; tombol Simpan/Batal di bawah lewat `FormActions`.
- [ ] Daftar entitas (kelas, ujian, dsb) memakai `EntityCard` + `StatGrid`; detail memakai `InfoGrid`, bukan tabel titik-dua.
- [ ] Warna hanya token; lencana/latar berwarna punya pasangan `*-foreground`.
- [ ] Tabel daftar memakai toolbar `tls-table-toolbar` + Atur Kolom + Filter Kolom + Ekspor.
- [ ] Dicek mode terang & gelap.
- [ ] Dicek di HP 375 px tanpa scroll horizontal halaman.
- [ ] `npx tsc --noEmit -p .` tanpa error baru.
- [ ] Tanpa logo/nama DJP, Coretax, Kemenkeu, atau CV/PT.
