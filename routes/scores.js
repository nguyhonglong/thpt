const express = require('express');
const router = express.Router();
const Score = require('../models/scores');

const combinations = {
    'A00': ['toan', 'vat_li', 'hoa_hoc'],           // Toán, Vật lí, Hóa học
    'A01': ['toan', 'vat_li', 'ngoai_ngu'],         // Toán, Vật lí, Ngoại ngữ
    'A02': ['toan', 'vat_li', 'sinh_hoc'],          // Toán, Vật lí, Sinh học
    'A03': ['toan', 'vat_li', 'lich_su'],           // Toán, Vật lí, Lịch sử
    'A04': ['toan', 'vat_li', 'dia_li'],            // Toán, Vật lí, Địa lí
    'A05': ['toan', 'hoa_hoc', 'lich_su'],          // Toán, Hóa học, Lịch sử
    'A06': ['toan', 'hoa_hoc', 'dia_li'],           // Toán, Hóa học, Địa lí
    'A07': ['toan', 'sinh_hoc', 'lich_su'],         // Toán, Sinh học, Lịch sử
    'A08': ['toan', 'sinh_hoc', 'dia_li'],          // Toán, Sinh học, Địa lí
    'B00': ['toan', 'hoa_hoc', 'sinh_hoc'],         // Toán, Hóa học, Sinh học
    'B01': ['toan', 'hoa_hoc', 'ngoai_ngu'],        // Toán, Hóa học, Ngoại ngữ
    'B02': ['toan', 'sinh_hoc', 'ngoai_ngu'],       // Toán, Sinh học, Ngoại ngữ
    'B03': ['toan', 'sinh_hoc', 'lich_su'],         // Toán, Sinh học, Lịch sử
    'B04': ['toan', 'sinh_hoc', 'dia_li'],          // Toán, Sinh học, Địa lí
    'C00': ['ngu_van', 'lich_su', 'dia_li'],        // Ngữ văn, Lịch sử, Địa lí
    'C01': ['ngu_van', 'toan', 'vat_li'],           // Ngữ văn, Toán, Vật lí
    'C02': ['ngu_van', 'hoa_hoc', 'sinh_hoc'],      // Ngữ văn, Hóa học, Sinh học
    'C03': ['ngu_van', 'toan', 'su_dia'],           // Ngữ văn, Toán, Sử Địa
    'C04': ['ngu_van', 'toan', 'ngoai_ngu'],        // Ngữ văn, Toán, Ngoại ngữ
    'D01': ['toan', 'ngu_van', 'ngoai_ngu'],        // Toán, Ngữ văn, Ngoại ngữ
    'D02': ['toan', 'ngu_van', 'vat_li'],           // Toán, Ngữ văn, Vật lí
    'D03': ['toan', 'ngu_van', 'hoa_hoc'],          // Toán, Ngữ văn, Hóa học
    'D04': ['toan', 'ngu_van', 'sinh_hoc'],         // Toán, Ngữ văn, Sinh học
    'D05': ['toan', 'ngu_van', 'lich_su'],          // Toán, Ngữ văn, Lịch sử
    'D06': ['toan', 'ngu_van', 'dia_li'],           // Toán, Ngữ văn, Địa lí
    'D07': ['toan', 'ngu_van', 'gdcd'],             // Toán, Ngữ văn, Giáo dục công dân
    'D08': ['toan', 'ngoai_ngu', 'su_dia'],         // Toán, Ngoại ngữ, Sử Địa
    'D78': ['ngu_van', 'lich_su', 'gdcd'],          // Ngữ văn, Lịch sử, Giáo dục công dân
    'D79': ['ngu_van', 'dia_li', 'gdcd'],           // Ngữ văn, Địa lí, Giáo dục công dân
    'D80': ['ngu_van', 'su_dia', 'gdcd'],           // Ngữ văn, Sử Địa, Giáo dục công dân
    'D81': ['toan', 'ngoai_ngu', 'lich_su'],        // Toán, Ngoại ngữ, Lịch sử
    'D82': ['toan', 'ngoai_ngu', 'dia_li'],         // Toán, Ngoại ngữ, Địa lí
    'D83': ['toan', 'ngoai_ngu', 'su_dia'],         // Toán, Ngoại ngữ, Sử Địa
    'D84': ['ngu_van', 'vat_li', 'hoa_hoc'],        // Ngữ văn, Vật lí, Hóa học
    'D85': ['ngu_van', 'hoa_hoc', 'sinh_hoc'],      // Ngữ văn, Hóa học, Sinh học
    'D86': ['ngu_van', 'toan', 'ngoai_ngu'],        // Ngữ văn, Toán, Ngoại ngữ
};

// Route để lấy thứ hạng của một thí sinh theo số báo danh
router.post('/rank', async (req, res) => {
    const { sbd, combination } = req.body;

    if (!sbd || !combination) {
        return res.status(400).send('Missing required fields: sbd or combination');
    }

    const subjects = combinations[combination];
    if (!subjects) {
        return res.status(400).send('Invalid combination');
    }

    console.log("start")

    try {
        console.log("start1")
        // Lấy dữ liệu của thí sinh cụ thể
        const candidate = await Score.findOne({ sbd: sbd });
        if (!candidate) {
            return res.status(404).send('Candidate not found');
        }
        console.log('Candidate data:', candidate);

        // Tính tổng điểm của các môn đã chọn
        const totalScore = subjects.reduce((total, subject) => {
            if (candidate[subject] !== undefined) {
                return total + candidate[subject];
            } else {
                console.warn(`Subject ${subject} not found for candidate ${sbd}`);
                return total;
            }
        }, 0);

        console.log(totalScore)

        // Sử dụng aggregation framework để tính toán thứ hạng toàn quốc
        const rankNational = await Score.aggregate([
            {
                $project: {
                    totalScore: {
                        $add: subjects.map(subject => `$${subject}`)
                    }
                }
            },
            {
                $match: {
                    totalScore: { $gt: totalScore }
                }
            },
            {
                $count: "rank"
            }
        ]).allowDiskUse(true);

        const nationalRank = rankNational.length > 0 ? rankNational[0].rank + 1 : 1;

        res.send({
            sbd: sbd,
            combination: combination,
            totalScore: totalScore,
            nationalRank: nationalRank,
            candidate: candidate
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/rank2', async (req, res) => {
    const { sbd, combination } = req.body;

    if (!sbd || !combination) {
        return res.status(400).send('Missing required fields: sbd or combination');
    }

    const subjects = combinations[combination];
    if (!subjects) {
        return res.status(400).send('Invalid combination');
    }

    const prefix = Math.floor(sbd / 1000000)

    try {
        const candidate = await Score.findOne({ sbd: sbd });
        if (!candidate) {
            return res.status(404).send('Candidate not found');
        }

        const totalScore = subjects.reduce((total, subject) => {
            if (candidate[subject] !== undefined) {
                return total + candidate[subject];
            } else {
                console.warn(`Subject ${subject} not found for candidate ${sbd}`);
                return total;
            }
        }, 0);

        console.log(prefix)

        const startNumber = Number(`${prefix}000000`);
        const endNumber = Number(`${prefix}999999`);
        const provincialRank = await Score.aggregate([
            {
                $match: {
                    sbd: { $gte: startNumber, $lte: endNumber }
                }
            },
            {
                $project: {
                    totalScore: {
                        $add: subjects.map(subject => `$${subject}`)
                    }
                }
            },
            {
                $match: {
                    totalScore: { $gt: totalScore }
                }
            },
            {
                $count: "rank"
            }
        ]);

        const rank = provincialRank.length > 0 ? provincialRank[0].rank + 1 : 1;

        res.send({
            provincialRank: rank
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/rank3', async (req, res) => {
    const { sbd, combination } = req.body;

    if (!sbd || !combination) {
        return res.status(400).send('Missing required fields: sbd or combination');
    }

    const subjects = combinations[combination];
    if (!subjects) {
        return res.status(400).send('Invalid combination');
    }

    const prefix = Math.floor(sbd / 1000000)

    try {
        const candidate = await Score.findOne({ sbd: sbd });
        if (!candidate) {
            return res.status(404).send('Candidate not found');
        }

        const totalScore = subjects.reduce((total, subject) => {
            if (candidate[subject] !== undefined) {
                return total + candidate[subject];
            } else {
                console.warn(`Subject ${subject} not found for candidate ${sbd}`);
                return total;
            }
        }, 0);

        let startNumber, endNumber, mien;

        if (prefix < 30) {
            startNumber = 1000000;
            endNumber = 29999999;
            mien = "Miền Bắc"
        }
        else{
            startNumber = 30000000;
            endNumber = 65000000;
            mien = "Miền Nam"
        }

        const provincialRank = await Score.aggregate([
            {
                $match: {
                    sbd: { $gte: startNumber, $lte: endNumber }
                }
            },
            {
                $project: {
                    totalScore: {
                        $add: subjects.map(subject => `$${subject}`)
                    }
                }
            },
            {
                $match: {
                    totalScore: { $gt: totalScore }
                }
            },
            {
                $count: "rank"
            }
        ]);

        const rank = provincialRank.length > 0 ? provincialRank[0].rank + 1 : 1;

        res.send({
            provincialRank: rank,
            mien: mien
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
