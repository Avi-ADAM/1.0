// src/lib/game-logic/PackageManager.svelte.ts
import { Vector3, CatmullRomCurve3 } from 'three';

export type PacketType = 'cube' | 'pyramid' | 'sphere' | 'coin';

export interface Packet {
	id: number;
	type: PacketType;
	color: string;
	progress: number;
	curve: CatmullRomCurve3;
	scale: number;
}

export class PacketSystem {
	packets = $state<Packet[]>([]);
	private idCounter = 0;

	// הוספת חבילה חדשה (עבודה או מטבע)
	addPacket(startPos: Vector3, endPos: Vector3, type: PacketType, color: string) {
		// יצירת קשת פרבולית יפה
		const midPoint = new Vector3().lerpVectors(startPos, endPos, 0.5);
		midPoint.y += 2.5; // גובה הקשת

		// שינוי קטן ואקראי כדי שלא כל הקשתות ייראו אותו דבר
		midPoint.x += (Math.random() - 0.5); 

		const curve = new CatmullRomCurve3([startPos, midPoint, endPos]);

		this.packets.push({
			id: this.idCounter++,
			type,
			color,
			progress: 0,
			curve,
			scale: type === 'coin' ? 1.2 : (Math.random() * 0.4 + 0.4)
		});
	}

	// עדכון כל פריים (רצים אחורה כדי למחוק בבטחה)
	update(delta: number) {
		for (let i = this.packets.length - 1; i >= 0; i--) {
			const p = this.packets[i];
			// מטבעות חוזרים מהר יותר
			const speed = p.type === 'coin' ? 0.8 : 0.5; 
			p.progress += delta * speed;

			if (p.progress >= 1) {
				// החבילה הגיעה ליעד!
				
				// אם זו הייתה עבודה שנשלחה -> היא הופכת למטבע שחוזר
				if (p.type !== 'coin') {
					const startPoint = p.curve.points[0]; // היוזר
					const endPoint = p.curve.points[2];   // האי
					
					// שולחים מטבע מהאי חזרה ליוזר
					this.addPacket(endPoint, startPoint, 'coin', '#FFD700');
				}

				// מחיקת החבילה שסיימה
				this.packets.splice(i, 1);
			}
		}
	}
}

// ייצוא מופע יחיד (Singleton) לשימוש בכל האפליקציה
export const packetSystem = new PacketSystem();