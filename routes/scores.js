const express = require('express');
const router = express.Router();
const Score = require('../models/scores');

const combinations = {
    'A00': ['toan', 'vat_li', 'hoa_hoc'],
    'A01': ['toan', 'vat_li', 'ngoai_ngu'],
    'B00': ['toan', 'hoa_hoc', 'sinh_hoc'],
    'C00': ['ngu_van', 'lich_su', 'dia_li'],
    'D01': ['toan', 'ngu_van', 'ngoai_ngu'],
    'D78': ['ngu_van', 'lich_su', 'dia_li']
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

    try {
        // Lấy dữ liệu của thí sinh cụ thể
        const candidate = await Score.findOne({ sbd: sbd });
        if (!candidate) {
            return res.status(404).send('Candidate not found');
        }

        // In ra chi tiết dữ liệu của thí sinh để kiểm tra
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

    try {
        const candidate = await Score.findOne({ sbd: sbd });
        if (!candidate) {
            return res.status(404).send('Candidate not found');
        }

        console.log('Candidate data:', candidate);

        const totalScore = subjects.reduce((total, subject) => {
            if (candidate[subject] !== undefined) {
                return total + candidate[subject];
            } else {
                console.warn(`Subject ${subject} not found for candidate ${sbd}`);
                return total;
            }
        }, 0);

        const provinceCode = String(sbd).padStart(8, '0').substring(0, 2);
        const candidatesInProvince = await Score.aggregate([
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

        if (candidatesInProvince.length === 0) {
            return res.status(404).send('No candidates found in the province');
        }

        const candidateList = candidatesInProvince[0].candidates;
        const totalCandidatesInProvince = candidateList.length;
        const provincialRank = candidateList.findIndex(c => c.sbd === sbd) + 1;

        res.send({
            sbd: sbd,
            combination: combination,
            totalScore: totalScore,
            provincialRank: provincialRank,
            totalCandidatesInProvince: totalCandidatesInProvince
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
