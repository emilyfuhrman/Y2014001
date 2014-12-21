var vis = {},
	txt = {},

	rw, mw, mh,
	mrh = 6, 			//rep marker height
	mhPad  = 4,			//marker padding
	mrhPad = 1,			//rep marker padding
	factor  = 10,		//size of one page num. increment
	zoomlvl = 1,

	fadein  = 2000,		//when to fade in

	topM  	= 162,		//where to start drawing markers
	marginB = 196,
	totalL	= 1294,
	totalW  = (rw +1)*totalL,

	//color palette
	cBlack 	= "#1d1d1d",
	cWhite  = "#fff",
	c1 		= "#e5005e",
	c2 		= "#007cc1",

	//array for comparing two characters; can only hold 2
	compare = [];

vis.charmap	= {	
	"bob":{"name":"Bob Cowley","id":"bob","order":1},
	"lidwell":{"name":"George Lidwell","id":"lidwell","link":true,"order":2,"transchars":["lydlid"]},
	"lydlid":{"name":"Lydia/Lidwell","id":"lydlid","trans":true,"order":3,"chars":["lydia","lidwell"]},
	"lydia":{"name":"Lydia Douce","id":"lydia","link":true,"order":4,"transchars":["lydlid","minlyd"]},
	"minlyd":{"name":"Mina/Lydia","id":"minlyd","trans":true,"order":5,"chars":["mina","lydia"]},
	"mina":{"name":"Mina Kennedy","id":"mina","link":true,"order":6,"transchars":["minlyd"]},
	"lenehan":{"name":"Lenehan","id":"lenehan","order":7},
	"richie":{"name":"Richie Goulding","id":"richie","order":8},
	"pat":{"name":"Pat","id":"pat","link":true,"order":9,"transchars":["patstrip"]},
	"patstrip":{"name":"Pat/Stripling","id":"patstrip","trans":true,"order":10,"chars":["pat","stripling"]},
	"stripling":{"name":"Blind Stripling","id":"stripling","link":true,"order":11,"transchars":["patstrip","bloomstrip"]},
	"bloomstrip":{"name":"Bloom/Stripling","id":"bloomstrip","trans":true,"order":12,"chars":["bloom","stripling"]},
	"bloom":{"name":"Bloom","id":"bloom","link":true,"order":13,"transchars":["bloomstrip"]},
	"boylan":{"name":"Blazes Boylan","id":"boylan","order":14},
	"kernan":{"name":"Tom Kernan","id":"kernan","order":15},
	"dedalus":{"name":"Simon Dedalus","id":"dedalus","order":16},
	"ben":{"name":"Ben Dollard","id":"ben","order":17},
	"none":{"name":"(none)","id":"none","order":18}
	};

vis.sorry = function(){
	d3.select("#sorry")
		.style("display","block")
		.transition()
		.duration(50)
		.style("opacity",1);
}

vis.calc = function(pend){
	if(pend){
		d3.select("#sorry")
			.transition()
			.style("opacity",0)
			.style("display","none");
		d3.select("#pending")
			.style("display","block")
			.style("opacity",1);
	}
	vis.w = window.innerWidth;
	vis.h = window.innerHeight;

	if(zoomlvl === 1){
		rw = 24;
		factor = 10;
	} else if(zoomlvl === 2){
		rw = 10;
		factor = 20;
	} else if(zoomlvl === 3){
		rw = 4;
		factor = 50;
	}
	mw = rw;
	mh = Math.ceil(vis.h/22);
	totalW  = (rw +1)*totalL;
}

vis.setup = function(){
	$(window).scrollTo({top:'0',left:'0'});
	d3.selectAll("#begin, #larr").classed("deactivated",true);
	d3.selectAll("#end, #rarr").classed("deactivated",false);
	d3.select("#zoom_0" +zoomlvl).classed("selectzoom",true);
	d3.select(".col.main svg")
		.attr("height",vis.h)
		.attr("width",totalW +rw)
		;
	d3.select("div.top")
		.on("mouseover",function(d){
			d3.selectAll(".charbtn")
				.classed("hov",false);
		});
}

vis.gettxtdata = function(callback){
	d3.text("data/sirens_annotated.txt",function(sirens){
		txt.data = sirens.split(/\n/g);
		vis.generate(txt);
		callback();
	});
}

vis.getvisdata = function(){
	d3.csv("data/freq.csv",function(data){
		vis.data = data;
		vis.drawdata(false);
	});
}

vis.transformVisData = function(){
	var data = {},
		wordcount = [];

	//holds every word associated with a character
	//occasionally a word could have a double, if
	//associated with two or more characters (ex. Martha)
	data.all = {};

	vis.data.forEach(function(d){

		//break words out by character
		if(!data[d.char]){
			data[d.char] = {};
			data[d.char].words = {};
			data[d.char].words[d.word] = {"reps":0};
		} else if(data[d.char].words && !data[d.char].words[d.word]){
			data[d.char].words[d.word] = {"reps":0};
		} else if(data[d.char].words && data[d.char].words[d.word]){
			var reps = data[d.char].words[d.word].reps +1;
			data[d.char].words[d.word] = {"reps":reps};
		}

		//overall word count
		if(!data.all[d.word]){
			data.all[d.word] = {"reps":0};
		} else{
			var allreps = data.all[d.word].reps +1;
			data.all[d.word] = {"reps":allreps};
		}
	});

	vis.data_charwords = data;
	return vis;
}

//draw chapter text and linebars
vis.generate = function(txt){

	var tagI = 0,

		//all linebar elements and dimensions
		chassis,
		linebarG, 
		linebars, 
		linenums;

	chassis = d3.select("svg.vis")
		.selectAll("g.chassis")
		.data([this]);
	chassis.enter().append("g")
		.classed("chassis",true);
	chassis.exit().remove();

	linebarG = chassis
		.selectAll("g.linebarG")
		.data(txt.data);
	linebarG.enter().append("g")
		.classed("linebarG",true)
		.classed("increment",function(d,i){
			return i === 0 || (i+1)%factor === 0;
		})
		.attr("id",function(d,i){
			return "_" +(i +1);
		});
	linebarG
		.attr("transform",function(d,i){
			var x = ((i+1)*(rw +1)),
				y = 0;
			return "translate(" + x + "," + y + ")";
		})
		.on("mouseover",function(d){
			expandCharBtns(d);
			baseText(d);
		})
		.on("mousemove",function(d){
			expandCharBtns(d);
			baseText(d);
		});
	linebarG.exit().remove();

	linebacks = linebarG
		.selectAll("line.lineback")
		.data(function(d){return [d];});
	linebacks.enter().append("line")
		.classed("lineback",true);
	linebacks
		.attr("class","lineback zoom_0" +zoomlvl)
		.attr("x1",0)
		.attr("y1",0)
		.attr("x2",0)
		.attr("y2",vis.h -marginB);
	linebacks.exit().remove();

	linebars = linebarG
		.selectAll("line.linebar")
		.data(function(d,i){ return [d]; });
	linebars.enter().append("line")
		.classed("linebar",true);
	linebars
		.attr("class","linebar zoom_0" +zoomlvl)
		.attr("x1",0)
		.attr("y1",0)
		.attr("x2",0)
		.attr("y2",vis.h -marginB);
	linebars.exit().remove();

	linenums = linebarG
		.selectAll("text.linenum")
		.data(function(d){return [d];});
	linenums.enter().append("text")
		.classed("linenum",true);
	linenums
		.attr("x",0)
		.attr("y",vis.h -marginB +40)
		.text(function(d){
			var tag = tagI === 0 ? (tagI +1) : (tagI +1)%factor === 0 ? (tagI+1) : "";
			tagI++;
			return tag;
		})
		.style("opacity",0)
		.transition()
		.duration(300)
		.style("opacity",1)
		;
	linenums.exit().remove();

	tagI = 0;

	/* UX FUNCTIONS ================================================================ */

	//expand character buttons on hover
	function expandCharBtns(d){
		var charselect = [],
			pgnum = (txt.data.indexOf(d) +1),
			chars = vis.data.filter(function(d){return parseInt(d.pg) === pgnum;});

		//un-expand any expanded btns
		d3.selectAll(".charbtn")
			.classed("hov",false);
		//unfold any transchars
		chars.forEach(function(d){
			if(vis.charmap[d.char].trans){
				var char1 = vis.charmap[d.char].chars[0],
					char2 = vis.charmap[d.char].chars[1];
				charselect.push(char1,char2);
			}
		});
		//make a non-duplicate list of assoc. chars
		chars.forEach(function(d){
			if(charselect.indexOf(d.char) <0){
				charselect.push(d.char);
			}
		});
		//expand those char buttons
		charselect.forEach(function(d){
			d3.selectAll(".charbtn#" +d)
				.classed("hov",true);
		});
	}

	//show line text on hover
	function baseText(d){
		var baseText,
			base = d3.select("div.base"),
			pgnum = txt.data.indexOf(d) +1;

		baseText = base
			.selectAll("div.baseTextMain")
			.data([d]);
		baseText.enter().append("div")
			.classed("baseTextMain",true);
		baseText
			.html(function(d,i){
				var l1 = (pgnum -1) + ". " +txt.data[txt.data.indexOf(d) -1],
					l2 = pgnum + ". " +d,
					l3 = (pgnum +1) + ". " +txt.data[txt.data.indexOf(d) +1];
				return l2;
			});
		baseText.exit().remove();

		baseText.selectAll("span").classed("hlbase",true);

		base
			.on("mouseover",function(){
				baseText.html("");
			});
	}
}

vis.drawdata = function(clear){

	vis.visible = [];

	if(clear){
		clearCompare();
	}

	//start with all markers visible
	vis.visible = d3.values(vis.charmap).filter(function(_d){return _d.name;});

	vis.transformVisData();
	drawCharBtns();

	var visH = vis.h -topM -marginB;
		
	drawMarkers(fadein +300);

	//add svg containers for visualization
	d3.select(".col.main")
		.attr("width",totalW)
		.attr("height",visH +topM +"px")
		.on("click",function(){
			clearCompare();
			shiftMarkers(225,600);
			d3.event.stopPropagation();
		});
	
	/* DRAW FUNCTIONS ============================================================== */

	//add controls at top: one for each character
	function drawCharBtns(){

		var charbtns,
			charspans;

		charbtns = d3.select("#topnav")
			.selectAll("div.charbtn")
			.data(d3.values(vis.charmap).filter(function(_d){return _d.name && !_d.trans;}));
		charbtns.enter().append("div")
			.classed("charbtn",true)
			.attr("id",function(d){
				return d.id;
			});
		charbtns
			.attr("class",function(d,i){
				var clss = i === 0 ? "charbtn first" : "charbtn";
				return clss;
			})
			.style("width",function(d){
				var w = window.innerWidth <1200 ? 45 : 57;
				return w + "px";
			})
			.style("height",function(d){
				var h = window.innerWidth <1200 ? 45 : 57;
				return h + "px";
			})
			.style("font-size",function(d){
				var s = window.innerWidth <1200 ? 10 : 13;
				return s + "px";
			})
			.on("mouseover",function(d){
				var color = cBlack,
					cc1 = false,
					cc2 = false;
				//un-expand any expanded btns
				d3.selectAll(".charbtn")
					.classed("hov",false);
				if(d3.select(this).classed("selected")){
					color = d3.select(this).classed("c1") ? c1 : c2;
					cc1 = color === c1;
					cc2 = color === c2;
				}
				d3.selectAll(".marker." +d.id)
					.classed("c1",cc1)
					.classed("c2",cc2);
			})
			.on("mouseout",function(d){
				var color = cBlack,
					cc1 = false,
					cc2 = false;
				if(d3.select(this).classed("selected")){
					color = d3.select(this).classed("c1") ? c1 : c2;
					cc1 = color === c1;
					cc2 = color === c2;
				}
				d3.selectAll(".marker." +d.id)
					.classed("c1",cc1)
					.classed("c2",cc2);
			})
			.on("click",function(d){
				selectChar(d,this);
				d3.event.stopPropagation();
			});
		charbtns.exit().remove();

		charspans = charbtns.selectAll("span.charspan")
			.data(function(d){return [d];});
		charspans.enter().append("span")
			.classed("charspan",true);
		charspans
			.html(function(d){return d.name;})
			.style("top",function(d){
				var t = window.innerWidth <1200 ? 9 : 12;
				return t + "px";
			});
		charspans.exit().remove();
	}

	function drawMarkers(delay){

		var visH  = vis.h -topM -marginB,
			delay = delay || 500,

			//add markers to svg
			markerG,
			charwordG,
			markers;

		//sort visible characters into original order
		vis.visible.sort(function(a,b){return a.order -b.order;});

		//restructure vis.visible chardata to be divided up by page
		vis.barData = organizeByPage(vis.visible);

		//overall page groups
		markerG = d3.select("svg.vis")
			.selectAll("g.markerG")
			.data(d3.keys(vis.barData));
		markerG.enter().append("g")
			.classed("markerG",true)
			;
		markerG
			.attr("id",function(d){
				return "_" +d;
			})
			.attr("transform",function(d){
				var x = ((rw +1) *parseInt(d)) -mw/2,
					y = topM;
				return "translate(" + x + "," + y + ")";
			})
			.style("opacity",1);
		markerG.exit().remove();

		//char/word groupings
		charwordG = markerG
			.selectAll("g.charwordG")
			.data(function(d){
				return d3.entries(vis.barData[d]); 
			});
		charwordG.enter().append("g")
			.classed("charwordG",true);
		charwordG
			.attr("class",function(d,i){
				return "charwordG " +d.key;
			})
			.attr("transform",function(d,i){
				var x = 0,
					y = markerY(d,i);
				return "translate(" + x + "," + y + ")";
			});
		charwordG.exit().remove();

		//individual markers
		markers = charwordG
			.selectAll("rect.marker")
			.data(function(d){ return d.value; });
		markers.enter().append("rect")
			.classed("marker",true)
			.attr("width",1)
			.style("opacity",0)
			;
		markers
			.attr("class",function(d,i){
				return "marker " +d.char + " _" +d.pg + " " +d.word + " tier_" +d.tier + " rep_" +d.rep;
			})
			.classed("trans",function(d){
				return vis.charmap[d.char].trans;
			})
			.attr("x",function(d,i){
				return vis.charmap[d.char].trans ? 0.5 : 0;
			})
			.attr("y",function(d,i){
				var rep = parseInt(d.rep),
					ry = rep >0 ? mh +((rep -1)*(mrh +mrhPad)) +mrhPad : 0;
				return vis.charmap[d.char].trans ? ry +0.5 : ry;
			})
			.attr("rx",function(){
				return window.devicePixelRatio > 1 ? 1 : 0;
			})
			.attr("height",function(d){
				var marxheight = parseInt(d.rep) === 0 ? mh : mrh;
				return vis.charmap[d.char].trans ? (marxheight -1) : marxheight;
			})
			.attr("width",function(d){
				return vis.charmap[d.char].trans ? (mw -1) : mw;
			})
			.style("stroke",function(d){
				return vis.charmap[d.char].trans ? "#1d1d1d" : "#fff";
			})
			.transition()
			.delay(function(d,i){
				var cushion = parseInt(d.rep)*35, 							//makes reps waterfall down after
					factor = zoomlvl === 3 ? 4 : zoomlvl === 2 ? 8 : 10; 	//speed of the ripple effect
				return (parseInt(d.pg)*(mw +1)) <(window.innerWidth*1.25) ? (parseInt(d.pg))*factor +delay +cushion : cushion;
			})
			.duration(25)
			.style("opacity",1)
			;
		markers
			.on("mouseover",function(d){
				d3.select(this).classed("over",true);
				d3.selectAll(".linebarG.highlight")
					.classed("highlight",false);
				d3.select(".linebarG#_" +d.pg).classed("highlight",true);
				markOver(d,1);
			})
			.on("mouseout",function(d){
				d3.select(this).classed("over",false);
				d3.selectAll(".linebarG.highlight")
					.classed("highlight",false);
				markOut(d,1);
			})
			.on("click",function(d){
				selectChar(d,this);
				d3.select(this).classed("over",false);
				d3.event.stopPropagation();
			});
		markers.exit().remove();
	}

	/* UX FUNCTIONS ================================================================ */

	//change ypos of markers
	function shiftMarkers(delay,dur){
		var delay = delay || 150,
			dur = dur || 500;
		d3.selectAll("span.hltxt")
			.classed("hltxt",false);
		d3.selectAll("g.charwordG")
			.transition()
			.delay(delay)
			.duration(function(d){
				return (Math.abs(visH/2 -d.ycoord)/(visH/2))*dur;
			})
			.attr("transform",function(d,i){
				var x = 0,
					y = markerY(d);
				return "translate(" + x + "," + y + ")";
			})
			;
	}

	function markerY(d,i){
		var y,
			index,
			prevPad = 0,
			pgGroup = vis.barData[d3.values(d.value)[0].pg],
			midChar_1  = visH/2 -(mh/2);

		pgGroup = sortData(d3.entries(pgGroup));

		function totalGroupLength(group){
			var length = (group.length -1)*(mh +mhPad);
			group.forEach(function(d){
				length += (d.value.length -1)*(mrh +mrhPad);
			});
			return length;
		}

		if(compare.length >0){

			//if marker belongs in the character row
			if(		d.value[0].char === compare[0] 
				|| 	d.value[0].char === compare[1]
				|| 	d.value[0].char === compare[2]
				||  d.value[1] &&  d.value[1].char === compare[0]
				||  d.value[1] &&  d.value[1].char === compare[1]
				||  d.value[1] &&  d.value[1].char === compare[2]	){

				var charGroup = pgGroup.filter(function(_d){
						return _d.value[0].char === compare[0] 
							|| _d.value[0].char === compare[1] 
							|| _d.value[0].char === compare[2] 
							|| _d.value[1] && _d.value[1].char === compare[0] 
							|| _d.value[1] && _d.value[1].char === compare[1] 
							|| _d.value[1] && _d.value[1].char === compare[2];
					}),
					charIndex = charGroup.map(function(_d){return _d.key;}).indexOf(d.key),
					startPt = midChar_1
					;
				for(var j=charIndex; j>0; j--){
					prevPad += (charGroup[j-1].value.length -1)*(mrh +mrhPad);
				}
				y = startPt +(charIndex*(mh +mhPad)) +prevPad +mhPad -(totalGroupLength(charGroup)/2);
			} else{
				pgGroup = pgGroup.filter(function(_d){
					return _d.value[0].char !== compare[0] && _d.value[0].char !== compare[1] && _d.value[0].char !== compare[2];
				});

				//check to see if "i" is passed in (won't detect correctly when i=0)
				index = arguments.length >1 ? i : pgGroup.map(function(_d){return _d.key;}).indexOf(d.key);
				if(index%2 === 0){
					for(var j=index; j>0; j-=2){
						prevPad += pgGroup[j-2] ? (pgGroup[j-2].value.length -1)*(mrh +mrhPad) : 0;
					}
					y = ((index/2)*(mh +mhPad)) +prevPad +mhPad;
				} else{
					for(var j=index; j>1; j-=2){
						prevPad += pgGroup[j-2] ? (pgGroup[j-2].value.length -1)*(mrh +mrhPad) : 0;
					}
					//basically reversing the top function so these end up at the bottom
					//remember to also subtract any submarkers + padding
					y = visH -(((index-1)/2)*(mh +mhPad)) -((d.value.length -1)*(mrh +mrhPad)) -mh -prevPad;
				}
			}
		} else{
			index = arguments.length >1 ? i : pgGroup.map(function(_d){return _d.key;}).indexOf(d.key);

			//how many reps to take into account that push the y-pos of the marker down?
			for(var j=index; j>0; j--){
				prevPad += (pgGroup[j-1].value.length -1)*(mrh +mrhPad);
			}
			y = (index*(mh +mhPad)) +prevPad +mhPad;
		}
		d.ycoord = y;
		return y;
	}

	function markOver(d,num){

		var num = num || 0,
			selectorString = "#_" +d.pg + " ._" +d.pg + "." +d.word,
			line = txt.data[parseInt(d.pg) -1];

		d3.selectAll(".charbtn")
			.classed("hov",false);

		//expand corresponding character button(s)
		if(vis.charmap[d.char].trans){
			var char1 = vis.charmap[d.char].chars[0],
				char2 = vis.charmap[d.char].chars[1];
			d3.selectAll(".charbtn#" +char1 + ",.charbtn#" +char2)
				.classed("hov",true);
		} else{
			d3.select(".charbtn#" +d.char)
				.classed("hov",true);
		}

		//add line text to bottom
		var baseText,
			pgnum = txt.data.indexOf(line) +1,
			wrd = d.word.split(" ").join("");

		baseText = d3.select("div.base")
			.selectAll("div.baseTextMain")
			.data([line]);
		baseText.enter().append("div")
			.classed("baseTextMain",true);
		baseText
			.html(function(d,i){
				var l1 = (pgnum -1) + ". " +txt.data[txt.data.indexOf(d) -1],
					l2 = pgnum + ". " +d,
					l3 = (pgnum +1) + ". " +txt.data[txt.data.indexOf(d) +1];
				return l2;
			});
		baseText.exit().remove();
		
		baseText.selectAll("span").classed("hlbase",true);
		d3.select("span." +wrd +"._" +d.rep)
			.classed("hltxt",true);

		d3.event.stopPropagation();
	}

	function markOut(d,num){

		var num = num || 0,
			selectorString = "#_" +d.pg + " ._" +d.pg + "." +d.word;

		//collapse corresponding character button(s)
		if(vis.charmap[d.char].trans){
			var char1 = vis.charmap[d.char].chars[0],
				char2 = vis.charmap[d.char].chars[1];
			d3.selectAll(".charbtn#" +char1 + ",.charbtn#" +char2)
				.classed("hov",false);
		} else{
			d3.select(".charbtn#" +d.char)
				.classed("hov",false);
		}

		d3.selectAll("span.hltxt")
			.classed("hltxt",false);
	}

	//called when either a button or marker is clicked
	function selectChar(d,self){

		var itemID = d.char || d.id,
			selected = d3.select(self).classed("selected"),
			c1empty = d3.selectAll(".charbtn.c1").empty();

		if(!selected){

			if(vis.charmap[itemID].trans){
				var chars = vis.charmap[itemID].chars,
					exist = false,
					index1 = 0,
					index2 = 1;

				//cycle through chars to see if one is already selected, to retain its index/color
				chars.forEach(function(_d,i){
					compare.forEach(function(c,_i){
						if(_d === c){
							index1 = i;
							index2 = index1 === 0 ? 1 : 0;
							exist = true;
						}
					});
				});

				c1empty = exist ? !d3.select(".marker." +chars[index1]).classed("c2") : true;

				clearCompare();

				//add coloring to newly-selected char and assoc. markers
				d3.selectAll(".charbtn#" +chars[index1] + ", .marker." +chars[index1])
					.classed("selected",true)
					.classed("c1",c1empty)
					.classed("c2",!c1empty)
					.classed("linked",true)
					;
				d3.selectAll(".charbtn#" +chars[index2] + ", .marker." +chars[index2])
					.classed("selected",true)
					.classed("c1",!c1empty)
					.classed("c2",c1empty)
					.classed("linked",true)
					;
				d3.selectAll(".marker." +itemID)
					.classed("selected",true);

				//keep transchar in [2]
				compare.push(chars[0],chars[1],itemID);
			} else{

				//clear out transchar selections
				if(compare.length === 3){
					c1empty = !d3.select(".charbtn#" +compare[0]).classed("c2");
					if(compare[2]){
						d3.selectAll(".marker." +compare[2])
							.classed("selected",false);
						d3.selectAll(".charbtn.linked")
							.classed("linked",false);
					}
					clearItems([compare[0],compare[2]]);

				} else if(compare.length === 2){
					c1empty = !d3.select(".charbtn#" +compare[0]).classed("c2");
					clearItems([compare[0]]);

				} else if(compare.length <2){
					c1empty = compare.length === 0 || (compare.length === 1 && d3.select(".charbtn#" +compare[0]).classed("c2"));
				}

				//add coloring to newly-selected char and assoc. markers
				d3.selectAll(".charbtn#" +itemID + ", .marker." +itemID)
					.classed("selected",true)
					.classed("c1",c1empty)
					.classed("c2",!c1empty)
					;

				compare.push(itemID);

				//check to see if both compare chars ==> a transchar
				if(vis.charmap[itemID].transchars && compare.length >1){
					vis.charmap[itemID].transchars.forEach(function(_d){
						vis.charmap[_d].chars.forEach(function(c){
							if(c === compare[0]){ 
								d3.selectAll(".marker." +_d).classed("selected",true);
								d3.selectAll(".charbtn.selected").classed("linked",true);
								compare.push(_d); 
							}
						});
					});
				}
			}

		} else if(selected){

			if(vis.charmap[itemID].trans){
				clearCompare();
			} else{
				clearItems([itemID]);

				if(vis.charmap[itemID].transchars){
					vis.charmap[itemID].transchars.forEach(function(t,i){
						d3.selectAll(".marker." +vis.charmap[itemID].transchars[i])
							.classed("selected",false);
						d3.selectAll(".charbtn.linked")
							.classed("linked",false);
						compare = compare.filter(function(_d){return _d !== t;});
					});
				}
			}
		}
		shiftMarkers(225,450);
	}

	function clearItems(items){
		var items = items || [];
		items.forEach(function(d){
			d3.selectAll(".charbtn#" +d + ", .marker." +d)
				.classed("selected",false)
				.classed("c1",false)
				.classed("c2",false)
				.classed("linked",false);
			compare = compare.filter(function(_d){return _d !== d;});
		});
	}

	function clearCompare(){
		d3.selectAll(".selected")
			.classed("selected",false)
			.classed("c1",false)
			.classed("c2",false)
			.classed("linked",false);
		compare = [];
	}

	/* CALC FUNCTIONS ============================================================== */

	//group visible character data by page number for easier bar height handling
	function organizeByPage(data){
		var _data = {};

		data.forEach(function(d){

			//retrieve array of all words associated with that char
			var chararray = vis.data.filter(function(_d){ return _d.char === d.id; });

			//iterate through to organize into page > rep > charword arrays
			chararray.forEach(function(_d){
				var pageNum = parseInt(_d.pg);
				if(!_data[pageNum]){
					_data[pageNum] = {};
					_data[pageNum][_d.word] = [];
					_data[pageNum][_d.word].push(_d);
				} else{
					if(!_data[pageNum][_d.word]){
						_data[pageNum][_d.word] = [];
						_data[pageNum][_d.word].push(_d);
					} else {
						_data[pageNum][_d.word].push(_d);
					}
				}
			});
		});
		return _data;
	}

	function sortData(data){
		var _data = $.extend([],data);
		/*_data.sort(function(a,b){
			return vis.data_charwords.all[a.key].reps -vis.data_charwords.all[b.key].reps;
		});*/
		return _data;
	}
}

vis.sizecols = function(){
	d3.select(".col.main, #viewbox")
		.style("width",totalW +rw +"px");
	d3.select("#pending")
		.transition()
		.delay(fadein)
		.duration(300)
		.style("opacity",0)
		.style("display","none");
}

vis.update = function(){
	vis.calc(true);
	vis.setup();
	vis.generate(txt);
	vis.drawdata(true);
	vis.sizecols();
}

/* NAV STUFF ================================================================ */

$("#begin").on("click",function(d){
	$(window).scrollTo( {top:'0', left: '0', easing: 'easeInCubic'}, 250 );
});
$("#larr").on("click",function(d){
	$(window).scrollTo( {top:'0', left: ($(window).scrollLeft() -(window.innerWidth*0.95))+'px', easing: 'easeInCubic'}, 250 );
});
$("#rarr").on("click",function(d){
	$(window).scrollTo( {top:'0', left: ($(window).scrollLeft() +(window.innerWidth*0.95))+'px', easing: 'easeInCubic'}, 250 );
});
$("#end").on("click",function(d){
	$(window).scrollTo( {top:'0', left: totalW+'px', easing: 'easeInCubic'}, 250 );
});

d3.selectAll(".zoom")
	.on("click",function(d){

		var self = d3.select(this);

		//reset the key vars for each zoom level
		d3.selectAll("g.markerG")
			.remove();
		d3.selectAll(".zoom").classed("selectzoom",false);

		compare = [];

		if(self.attr("id") === "zoom_01"){
			zoomlvl = 1;
		} else if(self.attr("id") === "zoom_02"){
			zoomlvl = 2;
		} else if(self.attr("id") === "zoom_03"){
			zoomlvl = 3;
		}
		d3.select("#zoom_0" +zoomlvl).classed("selectzoom",true);

		fadein = 50;
		vis.calc();
		vis.setup();
		vis.gettxtdata(vis.getvisdata);
		vis.sizecols();
	});

/* MECHANICS ================================================================ */

vis.checkScreen = function(){
	var isok;
	//check for mobile
	if( (/iPhone|iPod|iPad|Android|BlackBerry/).test(navigator.userAgent) 
		|| !(/iPhone|iPod|iPad|Android|BlackBerry/).test(navigator.userAgent) && window.innerWidth <1010 ){
		isok = false;
	} else{
		isok = true;
	}
	return isok;
}

if(vis.checkScreen()){
	vis.calc(true);
	vis.setup();
	vis.gettxtdata(vis.getvisdata);
	vis.sizecols();
} else{
	vis.sorry();
}

$(window).resize(function(){
	d3.select("#pending")
		.style("display","block")
		.style("opacity",1);
	if(vis.checkScreen()){
		vis.update();
	} else{
		vis.sorry();
	}
});

$(window).on('scroll',function(){
	d3.select("#ticker")
		.style("left",function(){
			var buffer = 70,
				scaledW = window.innerWidth -(buffer*2),
				scaledL = totalW -window.innerWidth,
				scroll = scaledW*($(window).scrollLeft()/scaledL) +buffer;
			scroll = $(window).scrollLeft() >scaledL ? (window.innerWidth -buffer -1) : scroll;
			return scroll +"px";
		});
	if($(window).scrollLeft() <50){
		d3.selectAll("#begin, #larr").classed("deactivated",true);
	} else if($(window).scrollLeft() > totalW -window.innerWidth){
		d3.selectAll("#end, #rarr").classed("deactivated",true);
	} else{
		d3.selectAll("#begin, #larr, #rarr, #end").classed("deactivated",false);
	}
});
