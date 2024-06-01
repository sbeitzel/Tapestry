
// xml.feed

function verify() {
	sendRequest(site)
	.then((xml) => {	
		const jsonObject = xmlParse(xml);
		
		const icon = "https://www.youtube.com/s/desktop/905763c7/img/favicon_144x144.png";
		
		if (jsonObject.feed != null) {
			// Atom 1.0
			const feedAttributes = jsonObject.feed.link$attrs;
			let feedUrl = null;
			if (feedAttributes instanceof Array) {
				for (const feedAttribute of feedAttributes) {
					if (feedAttribute.rel == "alternate") {
						feedUrl = feedAttribute.href;
						break;
					}
				}
			}
			else {
				if (feedAttributes.rel == "alternate") {
					feedUrl = feedAttributes.href;
				}
			}
			const feedName = jsonObject.feed.title;

			const verification = {
				displayName: feedName,
				icon: icon,
				baseUrl: feedUrl
			};
			processVerification(verification);
		}
		else if (jsonObject.rss != null) {
			// RSS 2.0
			processError(Error("Invalid feed format"));
		}
		else {
			processError(Error("Unknown feed format"));
		}
	})
	.catch((requestError) => {
		processError(requestError);
	});
}

const avatarRegex = /<link rel="image_src" href="([^"]*)">/

function load() {	
	console.log("load")
	sendRequest(site)
	.then((xml) => {
		
		let jsonObject = xmlParse(xml);
				
		if (jsonObject.feed != null) {
			// Atom 1.0
			const feedAttributes = jsonObject.feed.link$attrs;
			let feedUrl = null;
			if (feedAttributes instanceof Array) {
				for (const feedAttribute of feedAttributes) {
					if (feedAttribute.rel == "alternate") {
						feedUrl = feedAttribute.href;
						break;
					}
				}
			}
			else {
				if (feedAttributes.rel == "alternate") {
					feedUrl = feedAttributes.href;
				}
			}
			const feedName = jsonObject.feed.title;
			
			sendRequest(feedUrl)
			.then((html) => {
				const match = html.match(avatarRegex);
				const avatar = match[1];

				var creator = Creator.createWithUriName(feedUrl, feedName)
				creator.avatar = avatar
		
				const entries = jsonObject.feed.entry;
				var results = [];
				for (const entry of entries) {
					const entryAttributes = entry.link$attrs;
					let entryUrl = null;
					if (entryAttributes instanceof Array) {
						for (const entryAttribute of entryAttributes) {
						if (entryAttribute.rel == "alternate") {
							entryUrl = entryAttribute.href;
							break;
						}
					}
					}
					else {
						if (entryAttributes.rel == "alternate") {
							entryUrl = entryAttributes.href;
						}
					}

					const url = entryUrl;
					const date = new Date(entry.published); // could also be "entry.updated"
				
					// TODO: Use "media:content" to do content embed.
					// <media:content url="https://www.youtube.com/v/TstuOX6NldA?version=3" type="application/x-shockwave-flash" width="640" height="390"/>
					
					const mediaGroup = entry["media:group"];
				
					const thumbnail = mediaGroup["media:thumbnail$attrs"].url;
					const attachment = Attachment.createWithMedia(thumbnail);

					const content = mediaGroup["media:title"];
					const post = Post.createWithUriDateContent(url, date, content);
					post.creator = creator;
					post.attachments = [attachment];
				
					results.push(post);
				}

				processResults(results);
			})
			.catch((requestError) => {
				processError(requestError);
			});	
		}
		else if (jsonObject.rss != null) {
			// RSS 2.0
			processError(Error("Invalid feed format"));
		}
		else {
			// Unknown
			processResults([]);
		}
	})
	.catch((requestError) => {
		processError(requestError);
	});	
}
