import Calculation from "../models/calculation.js";
import Rendement from "../models/rendementcalc.js";

const polOffsets = {
    1: 0.02,
    2: 0.05,
    3: 0.07,
    4: 0.10,
    5: 0.12,
    6: 0.15,
    7: 0.17,
    8: 0.20,
    9: 0.22
};

async function getRealValue(enteredBrix, enteredPol) {
    const roundedBrix = Math.round(enteredBrix * 2) / 2;
    const basePol = Math.floor(enteredPol);

    // Get exact decimal (1-9) safely ignoring js floating point jank
    const decimalPol = Math.round((enteredPol - basePol) * 10);

    const record = await Calculation.findOne({
        Brix: roundedBrix.toString(),
        Polariscope: basePol.toString()
    });

    if (!record) {
        throw new Error(`Matching record not found for Brix ${roundedBrix} and Pol ${basePol}`);
    }

    let realValue = parseFloat(record.Value);

    // Add offset from lookup table if a decimal exists (.1 to .9)
    if (decimalPol > 0 && decimalPol < 10) {
        realValue += polOffsets[decimalPol];
    }

    return realValue;
}

export async function calculatePurity(req, res) {
    try {
        const { brix, pol } = req.body;

        if (!brix || !pol) {
            return res.status(400).json({ message: "Brix and Pol are required" });
        }

        const enteredBrix = parseFloat(brix);
        const enteredPol = parseFloat(pol);

        if (isNaN(enteredBrix) || isNaN(enteredPol) || enteredBrix === 0) {
            return res.status(400).json({ message: "Invalid calculation values" });
        }

        const realValue = await getRealValue(enteredBrix, enteredPol);
        const purity = (realValue / enteredBrix) * 100;

        return res.json({
            purity: purity.toFixed(2),
            valueFromDb: realValue.toFixed(2)
        });

    } catch (error) {
        return res.status(error.message.includes("Matching record") ? 404 : 500)
            .json({ message: error.message });
    }
}

export async function calculateRandement(req, res) {
    try {
        const { BatchId, brix, pol } = req.body;

        if (!BatchId || !brix || !pol) {
            return res.status(400).json({ message: "BatchId, Brix and Pol are required" });
        }

        const enteredBrix = parseFloat(brix);
        const enteredPol = parseFloat(pol);

        if (isNaN(enteredBrix) || isNaN(enteredPol) || enteredBrix === 0) {
            return res.status(400).json({ message: "Invalid calculation values" });
        }

        const realValue = await getRealValue(enteredBrix, enteredPol);
        const purity = (realValue / enteredBrix) * 100;

        // Rendement Formula: =( (purity-6.4)*0.78*(realValue-2)/100)
        const rawRendement = ((purity - 6.4) * 0.78 * (realValue - 2)) / 100;
        const rendement = parseFloat(rawRendement.toFixed(1));

        let grade = "Grade E";
        if (rendement > 7.5) {
            grade = "Grade A";
        } else if (rendement >= 7 && rendement <= 7.5) {
            grade = "Grade B";
        } else if (rendement >= 6.5 && rendement < 7) {
            grade = "Grade C";
        } else if (rendement >= 6 && rendement < 6.5) {
            grade = "Grade D";
        } else {
            grade = "Grade E"; // < 6
        }

        // Save to Database
        const newRendement = new Rendement({
            BatchId,
            Brix: enteredBrix,
            Pol: enteredPol,
            Purity: parseFloat(purity.toFixed(2)),
            Rendement: rendement,
            Grade: grade,
            RealValue: realValue.toFixed(2)
        });

        await newRendement.save();

        return res.status(201).json({
            message: "Rendement calculated and saved successfully",
            data: {
                BatchId,
                brix: enteredBrix,
                pol: enteredPol,
                purity: purity.toFixed(2),
                realValue: realValue.toFixed(2),
                rendement: rendement.toFixed(1),
                grade: grade,
                RealValue: realValue.toFixed(2)
            }
        });

    } catch (error) {
        return res.status(error.message.includes("Matching record") ? 404 : 500)
            .json({ message: error.message });
    }
}

export async function getRendement(req, res) {
    try {
        const rendements = await Rendement.find();
        return res.status(200).json({
            message: " fetched successfully",
            data: rendements
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}