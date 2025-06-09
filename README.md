# Course API Backend

## Fitur Personalisasi Material (Pengaturan Progress User)

Fitur ini memungkinkan user untuk melacak kemajuan belajar mereka di setiap materi yang tersedia.

### Status Materi

Setiap materi memiliki status berdasarkan interaksi user:

1. **Completed**: Materi dianggap selesai jika user telah mengerjakan quiz terkait dan mendapatkan nilai minimal 80%.
2. **In Progress**: User telah memulai materi (mengerjakan quiz) tapi belum mencapai nilai 80%.
3. **Not Started**: User belum pernah mengerjakan quiz terkait materi.
4. **Locked**: Materi terkunci karena materi sebelumnya belum diselesaikan.

### Fitur Filter

User dapat memfilter materi berdasarkan status:
- Completed (Selesai)
- Incomplete (In Progress)
- Not Started (Belum Dimulai)
- Locked (Terkunci)

### Sistem Penguncian

- Materi pertama selalu terbuka untuk semua user
- Materi berikutnya akan terkunci sampai user menyelesaikan materi sebelumnya (mendapat nilai minimal 80% pada quiz)
- User dapat mengambil quiz berulang kali untuk mendapatkan nilai yang lebih baik

### API Endpoints

- `GET /api/materi`: Mendapatkan semua materi dengan status personalisasi
  - Query parameter: `filter` (opsional) dengan nilai `completed`, `in_progress`, `not_started`, atau `locked`
- `POST /api/quiz`: Menyimpan hasil quiz user