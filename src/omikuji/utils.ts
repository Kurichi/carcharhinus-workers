import { MAX_PROBABILITY } from "./const";

export const decideOmikuji = (
	omikujis: {
		id: string;
		created_at: Date | null;
		updated_at: Date | null;
		grade: string;
		probability: number;
	}[],
): string | null => {
	const ramdom = Math.floor(Math.random() * (MAX_PROBABILITY + 1));
	console.log(ramdom);
	let sum = 0;
	for (const omikuji of omikujis) {
		sum += omikuji.probability;
		if (sum >= ramdom) {
			return omikuji.id;
		}
	}
	return null;
};
