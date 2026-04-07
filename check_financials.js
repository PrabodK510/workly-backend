async function testFetch() {
    try {
        const login = await fetch('http://localhost:5000/api/admin/login', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'password123' })
        });
        const loginData = await login.json();
        const token = loginData.token;

        const res = await fetch('http://localhost:5000/api/admin/financials', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Is it null?", data.platformTotalProfit === null);
        console.log("Value:", data.platformTotalProfit);
    } catch(e) {
        console.error("ERROR", e);
    }
}
testFetch();
