//
// SECTION 1: REPLACEMENTS
//

//replace <tutor-email> tag with code that will display email address with copy function and informational tooltip
$('trevorkafka-email').replaceWith(`
	<span class="tooltip">
		<a onclick="copyEmail()" onmouseout="outFunc()">tutor@trevorkafka.com</a>
		<span class="tooltiptext">Copy to clipboard</span>
	</span>
	`)

//replace <trevorkafka-nav> with navigation bar code
$('trevorkafka-nav').replaceWith(`
	<div class="navbar">
		<div class="navbar-elements">
			<a href="index.html">Trevor Kafka 🏠</a>
			<a href="call.html">Call 📞</a>
			<a href="login.html">Login 💯</a>
		</div>
	</div>
	`)

//replace <trevorkafka-footer> with footer code
$('trevorkafka-footer').replaceWith(`
	<footer align="center" style="background-color: #F2F2F2">
		<div class="content widescreen" style="padding-top: 50px; padding-bottom: 30px;">
			<table>
				<tr>
					<td><img src="TK portugal.png" alt="Trevor Kafka headshot in Portugal" style="width: 200px; margin-right: 20px;"></td>
					<td align="center">
						<p> Success for everyone is right around the corner. Take your first steps with me today. ~Trevor Kafka </p>

						<p>
							Contact me:
							<span class="tooltip">
								<a onclick="copyEmail()" onmouseout="outFunc()">tutor@trevorkafka.com</a>
								<span class="tooltiptext">Copy to clipboard</span>
							</span>
							&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a href="index.html">Home</a> | <a href="call.html">Call</a> | <a href="login.html">Login</a>
						</p>

						<p style="color: grey">Please be aware that while tutoring can greatly enhance learning, specific outcomes cannot be guaranteed. However, I am committed to delivering high-quality tutoring services. It's important for students to actively engage and invest effort to attain their goals. I will provide you with the tools and guidance needed, but your dedication, hard work, and consistent practice are crucial for achieving success. Together, let's work towards your academic aspirations.</p>
					</td>
				</tr>
			</table>
		</div>
		<div class="content narrowscreen" style="padding-top: 50px; padding-bottom: 30px;">
			<img src="TK portugal.png" alt="Trevor Kafka headshot in Portugal" style="width: 40vw">
			<br><br>
			<p> Success for everyone is right around the corner. Take your first steps with me today. ~Trevor Kafka </p>
			<p>
				Contact me:
				<span class="tooltip">
					<a onclick="copyEmail()" onmouseout="outFunc()">tutor@trevorkafka.com</a>
					<span class="tooltiptext">Copy to clipboard</span>
				</span>
				<br>
				<a href="index.html">Home</a> | <a href="call.html">Call</a> | <a href="login.html">Login</a>
			</p>

			<p style="color: grey">Please be aware that while tutoring can greatly enhance learning, specific outcomes cannot be guaranteed. However, I am committed to delivering high-quality tutoring services. It's important for students to actively engage and invest effort to attain their goals. I will provide you with the tools and guidance needed, but your dedication, hard work, and consistent practice are crucial for achieving success. Together, let's work towards your academic aspirations.</p>
		</div>
	</footer>
	`)

//replacements <trevorkafka-home-info1>
$(`trevorkafka-home-info1`).replaceWith(`
	<p style="font-size: min(80px, calc((80/600)*100vw)); margin-bottom:-10px; font-family: Great Vibes">
		Trevor Kafka
	</p>
	<p>
		Professional Online Tutor<br>
		From United States<br>
		Living in Boston, United States
	</p>
	<p>
		<strong>Exams Taught:</strong> SAT, ACT, AP<br>
		<strong>Levels Taught:</strong> Middle School &ndash; Adult<br>
		<strong>Subjects:</strong> See <a href="#FAQ">FAQ</a> for full math and physics subject list.<br>
		<strong>Contact email:</strong> <span class="tooltip">
		<a onclick="copyEmail()" onmouseout="outFunc()">tutor@trevorkafka.com</a>
		<span class="tooltiptext">Copy to clipboard</span>
	</span>					
		<br>
	</p>

	<details>
		<summary>My Availability</summary>
		<div align="center">
			<table class="timetable tinytext">
		<tr>
			<td></td>
			<td>Sun</td>
			<td>Mon</td>
			<td>Tue</td>
			<td>Wed</td>
			<td>Thu</td>
			<td>Fri</td>
			<td>Sat</td>
		</tr>
		<tr>
			<td>08:00a</td>
			<td></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>09:00a</td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>10:00a</td>
			<td class="available"></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>11:00a</td>
			<td class="available"></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>12:00a</td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>01:00p</td>
			<td class="available"></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>02:00p</td>
			<td class="available"></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>03:00p</td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>04:00p</td>
			<td></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>05:00p</td>
			<td></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>06:00p</td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>07:00p</td>
			<td></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>08:00p</td>
			<td></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>09:00p</td>
			<td></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td class="available"></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>&nbsp;</td>
		</tr>
		<tr>
			<td class="available"></td>
			<td colspan="7" style="text-align:left"> = classes generally offered </td>
		</tr>
	</table>
		</div>
		<div>
			<ul>
				<li>The above schedule is listed in US Eastern Time: UTC-4 or UTC-5 <a href="https://www.timeanddate.com/worldclock/converter.html?p1=43" target="_blank">depending on the time of the year</a>.</li>
				<li>Classes must be scheduled at least 12h in advance of class time and may be cancelled or rescheduled up to 24h in advance of class time.
				<li>All class scheduling and cancellations are managed through the student portal, accessed by registered students by <a href="login.html">logging in</a>.</li>
				<li>No classes are offered June 14 through August 24, 2024.</li>
			</ul>
		</div>
	</details>
	<details>
		<summary>My Education</summary>
		<div>
			✓ <strong>BS Physics</strong> from Brandeis University <br>
			✓ <strong>BS Mathematics</strong> from Brandeis University <br>
			✓ <strong>Magna Cum Laude</strong> recognition, <strong>GPA 3.9</strong> <br>
		</div>
	</details>
	<details>
		<summary>My Work Experience</summary>
		<div>
			✓ <strong>Professional Teacher</strong> since 2014 <br>
			✓ <strong>Wellesley High School</strong> 2014-2016 <br>
			✓ <strong>Boston Leadership Institute</strong> 2017-2018 <br>
			✓ <strong>Shulman & Hill</strong> LLC 2017 <br>
			✓ <strong>Self-employed tutoring</strong> 2015-now
		</div>
	</details>
	<details>
		<summary>My Credentials</summary>
		<div>
			✓ <strong>Highly experienced</strong> teacher and tutor (since 2014). <br>
			✓ <strong>Highly experienced</strong> with online instruction (since summer 2019). <br>
			✓ <strong>Highly enthusiastic</strong> about teaching YOU! <br>
			✓ <strong><a href="https://www.polyglotassociation.org/members/trevor-kafka">Certified HYPIA Polyglot</a></strong> speaking 8 languages, and always learning more!
		</div>
	</details>
	<details>
		<summary>My Languages</summary>
		<div>
			<p>I love learning languages and am always spending time either practicing ones I've been learning for a while or exploring new ones.</p>

			<p>Aside from being a native English speaker, my learned languages are Español (Spanish), Français (French), 汉语 (Mandarin), 日本語 (Japanese), 粵語 (Cantonese), Nederlands (Dutch), and ภาษาไทย (Thai), along with occasional dabbling in Tiếng Việt (Vietnamese) and Deutsch (German).</p>

			<p>You can check out more information on my <a href="https://www.polyglotassociation.org/members/trevor-kafka">HYPIA profile</a>.</p>
		</div>
	</details>
	`)

//replacements <trevorkafka-home-info2>
$(`trevorkafka-home-info2`).replaceWith(`
	<img src="TK indonesia.png" alt="Trevor Kafka headshot in Indonesia" style="width: min(225px, 90vw)">
	<div style="height:25px"></div>
	<img src="arrows.png" width="200px" alt="downwards-pointing arrows">
	<p><strong>Ready to make the change you've always dreamed of?</strong></p>
	<a href="call.html" class="button">
		<div align="center">Schedule an intro call today!</div>
	</a>
	`)

//
// SECTION 2: SPECIFIC-USE FUNCTIONS
//

// Script that makes sure that only one "details" panel can be opened at a time.
// Code source: https://stackoverflow.com/questions/16751345/automatically-close-all-the-other-details-tags-after-opening-a-specific-detai

const All_Details = document.querySelectorAll('details');

All_Details.forEach(deet=>{
  deet.addEventListener('toggle', toggleOpenOneOnly)
})

function toggleOpenOneOnly(e) {
  if (this.open) {
    All_Details.forEach(deet=>{
      if (deet!=this && deet.open) deet.open = false
    });
  }
}

// SECTION 2.1: EMAIL LINK TOOLTIP STUFF

	//define function setText(text) that sets the all the tooltip texts to text
	function setText(text) {
		Array.from(document.getElementsByClassName("tooltiptext")).forEach(function (ele, index) {
			ele.innerHTML = text;
		}); 
	}

	//define a function that both copies the email address and changes the tooltip text to notify that the email has been copied
	function copyEmail() {
		var copyText = "tutor@trevorkafka.com";
		navigator.clipboard.writeText(copyText);
	  setText("Copied: " + copyText);
	}

	//define a function that resets the tooltip text when the mouse is no longer hovering over the email address
	function outFunc() {
		setText("Copy to clipboard");
	}