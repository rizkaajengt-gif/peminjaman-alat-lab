import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import jurusanRouter from "./jurusan.js";
import laboratoriumRouter from "./laboratorium.js";
import alatRouter from "./alat.js";
import bahanRouter from "./bahan.js";
import peminjamanAlatRouter from "./peminjaman-alat.js";
import peminjamanRuanganRouter from "./peminjaman-ruangan.js";
import permintaanBahanRouter from "./permintaan-bahan.js";
import kontenRouter from "./konten.js";
import laporanRouter from "./laporan.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/jurusan", jurusanRouter);
router.use("/laboratorium", laboratoriumRouter);
router.use("/alat", alatRouter);
router.use("/bahan", bahanRouter);
router.use("/peminjaman-alat", peminjamanAlatRouter);
router.use("/peminjaman-ruangan", peminjamanRuanganRouter);
router.use("/permintaan-bahan", permintaanBahanRouter);
router.use(kontenRouter);
router.use("/laporan", laporanRouter);

export default router;
