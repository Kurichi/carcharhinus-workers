import { MAX_PROBABILITY } from "./const";

export const decideOmikuji = (
	omikujis: {
		id: string;
		created_at: Date | null;
		updated_at: Date | null;
		grade: string;
		probability: number;
	}[],
): { id: string | null; display: string } => {
	const ramdom = Math.floor(Math.random() * (MAX_PROBABILITY + 1));
	let sum = 0;
	for (const omikuji of omikujis) {
		sum += omikuji.probability;
		if (sum >= ramdom) {
			return { id: omikuji.id, display: omikuji.grade };
		}
	}
	return { id: null, display: "error" };
};
