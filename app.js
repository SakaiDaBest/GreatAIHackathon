async function checkNews() {
  const userInput = document.getElementById("news-input").value;

  const response = await fetch("https://gj2322u.execute-api.ap-southeast-2.amazonaws.com/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: userInput }),
  });

  const data = await response.json();
  document.getElementById("result").innerText = data;
}
