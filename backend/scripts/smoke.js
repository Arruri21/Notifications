const base = process.env.BASE_URL || 'http://localhost:4000';

async function main() {
	try {
		const postRes = await fetch(`${base}/events`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ type: 'like', sourceUserId: 'userA', targetUserId: 'userB' })
		});
		console.log('POST /events status', postRes.status);
		console.log(await postRes.text());
		await new Promise(r => setTimeout(r, 1000));
		const getRes = await fetch(`${base}/notifications/userB`);
		console.log('GET /notifications status', getRes.status);
		console.log(await getRes.text());
	} catch (e) {
		console.error('Smoke test failed', e);
		process.exitCode = 1;
	}
}

main();

