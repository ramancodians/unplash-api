const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const url = require('url');
const cache = require('memory-cache');

const PORT = process.env.PORT || 4000
const UNPLASH_BASE_URL = "https://unsplash.com/napi/photos"
const falseURL = "https://images.unsplash.com/photo-1445252454112-997778161cbe?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=69f1f22d5f284102e89cbeaf4262d0ff"
const app = express();

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get("/", (req, res) => {
  res.send("hello app")
})

app.get("/api/*", async function(req, res) {
  try {
    const pathname = url.parse(req.url).pathname
    const resArray = pathname.split("/")
    const type = resArray[3]
    const id = resArray[2]
    if (!type || !id ) {
      res.redirect(falseURL)
    } else {
      const cachedData = cache.get(id)
      if (cachedData) {
        handleResponse(res, cachedData, type)
      } else {
        const hitUrl = `${UNPLASH_BASE_URL}/${id}/info?`
        const startTime = Date.now()
        console.log("URL => ", hitUrl);
        request(hitUrl, (error, response, body) => {
          if (error) { res.status(500).send("failed") }
          else {
            const diff = (Date.now() - startTime)/ 1000;
            console.log("Response in =>", `${diff} seconds`);
            const parsedBody = JSON.parse(body)
            cache.put(id, parsedBody)
            console.log("Data cached for", id);
            handleResponse(res, parsedBody, type)
          }
        }) // reuest ends
      } // cached data check end
    } // param checks end
  } catch (e) {
    console.log(e);
    res.status(500).send("failed")
  }
})

app.listen(PORT, () => {
  console.log(`Listening at Port ${PORT}`);
})

function handleResponse( res, data, type = "small") {
  res.redirect(data.urls[type])
}
