import { Component, OnInit, ViewChild } from '@angular/core';
import {Observable,of, from } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SyntaxEntry } from './syntax'; 

@Component({
  selector: 'app-first-tree',
  templateUrl: './first-tree.page.html',
  styleUrls: ['./first-tree.page.scss'],
})
export class FirstTreePage implements OnInit {

  @ViewChild('treeCanvas', { static: false }) canvas: any; 
  canvasElement: any;
  canvas1:any;
  ctx:any;  //global canvas context

  userInput:string;
  result:any;
  obs: Observable<any>;
  syntaxEntryArray:SyntaxEntry[];

  canvasWidth:number;
  minimumPartition:number;
  initialY:number;
  jsonObject:any;


  constructor(public httpClient: HttpClient) { 
    this.userInput = "";
    this.result = {};
    this.initialY = 85;
    this.loadJsonSampleResponse();

  }

  ngOnInit() {
    this.userInput = "I came to this place, and she did too.";
    this.canvasWidth = 1500;
    this.minimumPartition = 40;
  }

  ngAfterViewInit(){
    this.canvasElement = this.canvas.nativeElement;
    this.canvasElement.width = this.canvasWidth;  
    this.canvasElement.height = 300;
    this.ctx = this.canvasElement.getContext('2d');
    this.drawBoundaryRect();
    this.drawFirstRow();
    this.syntaxEntryArray = [];


  }

  drawVisualTree(){
    this.clearCanvas();
    // We don't need word lengths in pixels or in chars.
    let numWords:number = this.syntaxEntryArray.length;
    if(numWords == 0) return;
    let partition = this.canvasWidth/numWords;
    if(partition < this.minimumPartition) partition = this.minimumPartition;
    let leftMargin = partition/6;

    this.ctx.font = '12px serif';
    this.ctx.fillStyle = "green";
    this.ctx.lineWidth = 1.4;
    
    //Fill in distance from head.  We may need it as abs() in some places
    for(var j = 0; j < this.syntaxEntryArray.length; j++){
      this.syntaxEntryArray[j].distanceFromHead = this.syntaxEntryArray[j].dEheadTokenIndex - j;  //Math.abs(this.syntaxEntryArray[j].dEheadTokenIndex - j);
    }

    //Sort the array, so that upityness can be graduated
    console.log("Unsorted Array:");
    console.log(this.syntaxEntryArray);
    let sortedArray:SyntaxEntry[] = [];
    this.syntaxEntryArray.forEach(val => sortedArray.push(Object.assign({}, val)));
    sortedArray.sort(function(a, b) {
      return a.dEheadTokenIndex - b.dEheadTokenIndex;
    });
    
    //IMPORTANT: This line actually clears any previous canvas
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    let xPos = leftMargin + 20;
    let centeringLeftOffset = 0; 
    let fontSizeFactor = 5;
    
    for(var i = 0; i < numWords; i++){ 
      
      //draw left-based vertical lines to be used in centering
      /* this.ctx.beginPath();
      this.ctx.moveTo(xPos, 0);
      this.ctx.lineTo(xPos, 200);
      this.ctx.stroke(); */

      //Draw 1st text row - deLabel (curves are at the bottomof this method)
      this.ctx.font = "12px serif";
      this.ctx.lineWidth = "1.4";
      this.ctx.fillStyle = "green";
      centeringLeftOffset = fontSizeFactor*(this.syntaxEntryArray[i].dElabel.length/2); //num chars X fontSizeFactor
      //console.log("centeringLeftOffset = " + centeringLeftOffset)
      this.ctx.fillText( this.syntaxEntryArray[i].dElabel, xPos - centeringLeftOffset, 105); // [, maxWidth]
     
      //Make 2nd row - OriginalWord
      this.ctx.fillStyle = "black";
      this.ctx.font = "Bold 14px";//slightly larger "14px Arial bold";
      centeringLeftOffset = fontSizeFactor*(this.syntaxEntryArray[i].OriginalWord.length/2);
      this.ctx.fillText(this.syntaxEntryArray[i].OriginalWord, xPos - centeringLeftOffset, 135); 
      this.ctx.fill();
      //Make 3rd row - lemma
      this.ctx.fillStyle = "blue";
      this.ctx.font = "Regular 12px";
      centeringLeftOffset = fontSizeFactor*(this.syntaxEntryArray[i].lemmaTextCoalesce.length/2);
      this.ctx.fillText(this.syntaxEntryArray[i].lemmaTextCoalesce, xPos - centeringLeftOffset, 150); 
      this.ctx.fill();
      //Make 4th row - pos
      this.ctx.fillStyle = "green";
      //this.ctx.font = "Regular 12px";
      centeringLeftOffset = 5 + fontSizeFactor*(this.syntaxEntryArray[i].pos.length/2);
      this.ctx.fillText(this.syntaxEntryArray[i].pos, xPos - centeringLeftOffset, 165); 
      this.ctx.fill();

      //Make 5th row - deeper-y - Morphology
      let attribs:partOfSpeechAttribs[]  = this.fillPosAttribsArray(this.syntaxEntryArray[i]);
      let yIncrement = 0;
      this.ctx.font = "12px";
      if(this.syntaxEntryArray.length > 7) this.ctx.font = "10px"; 
      this.ctx.lineWidth = "1.0";
      this.ctx.fillStyle = "blue";
      for(var j = 0; j < attribs.length; j++) {
        if(attribs[j].value.indexOf('UNKNOWN') >=  0) continue;
        yIncrement = yIncrement + 14;
        centeringLeftOffset = 5 + (fontSizeFactor)*((attribs[j].name + "=" + attribs[j].value).length/2);
        this.ctx.fillText(attribs[j].name + "=" + attribs[j].value, xPos - centeringLeftOffset, 180 + yIncrement); 
        this.ctx.fill();
      }
      xPos = xPos + partition;
    }//end for


    // Draw the bezier curves with shortest having the least upityness and longest the most.  
    xPos = leftMargin + 20;
    let startPoint:point = {x:xPos, y:this.initialY};
    let endPoint:point = {x:0, y:this.initialY};
    let tempDistance = 0;
    leftMargin = leftMargin + 5;
    let upityiness:number = 0; 

    //Bezier Curves
    for(var i = 0; i < this.syntaxEntryArray.length; i++){ 
      tempDistance = this.syntaxEntryArray[i].distanceFromHead;
      this.setColor(i);
      upityiness = 30 + Math.abs(11*tempDistance); 
      let spOffest = 0;  
      if(tempDistance == 0) continue;  

      startPoint["x"] = i*(partition) + xPos;
      endPoint["x"] = startPoint["x"] + tempDistance*partition;
      this.drawBezierCurve(startPoint, endPoint, upityiness);
      this.drawArrowHeadAt(startPoint["x"], startPoint["y"], endPoint, false);
    }

  } // end drawVisualTree

  fillPosAttribsArray(syntaxEntry:SyntaxEntry){ //for morph
    let posAttrib = new partOfSpeechAttribs(); 
    let aName = "";
    let pArray:partOfSpeechAttribs[] = [];
    for(var j = 0; j < 9; j++) {
      posAttrib = new partOfSpeechAttribs();
      posAttrib.index = j;
      (j == 0) ? aName = "case" : "";
      (j == 1) ? aName = "person" : "";
      (j == 2) ? aName = "voice" : "";
      (j == 3) ? aName = "mood" : "";
      (j == 4) ? aName = "tense" : "";
      (j == 5) ? aName = "aspect" : "";
      (j == 6) ? aName = "gender" : "";
      (j == 7) ? aName = "number" : "";
      (j == 8) ? aName = "proper" : "";
      posAttrib.name = aName;
      posAttrib.value = syntaxEntry.partOfSpeech[aName];
      pArray[j] = posAttrib;
    }//for
    return pArray;
  }

  drawArrowHeadAt(startX:number, startY:number, endpoint:point, reverseFromGoogle:boolean){
    startX = startX + 0;
    if(reverseFromGoogle) {
      startX = endpoint["x"];
      startY = endpoint["y"];
    }
    this.ctx.beginPath();
    this.ctx.moveTo(startX - 3, startY);
    this.ctx.lineTo(startX + 3, startY);
    this.ctx.lineTo(startX, startY + 5);
    this.ctx.closePath();
    //this.ctx.fillStyle = "black";
    this.ctx.fill(); 
  }

  setColor(i:number){

    if(i == 0) {this.ctx.strokeStyle = "green"; this.ctx.fillStyle = "green"; } 
    else if(i == 1) { this.ctx.strokeStyle = "red"; this.ctx.fillStyle = "red"; }
    else if(i%6 == 0) { this.ctx.strokeStyle = "tan"; this.ctx.fillStyle = "tan"; }
    else if(i%5 == 0) { this.ctx.strokeStyle = "orange"; this.ctx.fillStyle = "orange"; }
    else if(i%4 == 0) { this.ctx.strokeStyle = "purple"; this.ctx.fillStyle = "purple"; } 
    else if(i%3 == 0) { this.ctx.strokeStyle = "cyan"; this.ctx.fillStyle = "cyan"; }
    else if(i%2 == 0) { this.ctx.strokeStyle = "brown"; this.ctx.fillStyle = "brown"; }
    else { this.ctx.strokeStyle = "gray"; this.ctx.fillStyle = "gray"; }
  }

  drawBoundaryRect(){
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = 'tan';
    this.ctx.strokeRect(0, 0, this.canvasWidth, 200);

  }

  drawFirstRow(){
    //Draw deLabel row boundaries
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "cyan";
    this.ctx.strokeRect(0, 90, this.canvasWidth, 20);

  }

  drawBezierCurve(startPoint:point, endPoint:point, upityness:number){
    // control points be calculated internally.
    //this.clearCanvas();
    if(upityness > 115) upityness = 115;//Max out humpetybackedness
    let cp1:point = { x:startPoint["x"] + 0,   y: startPoint["y"] - upityness };
    let cp2:point = { x:endPoint["x"] + 0,   y:  endPoint["y"]  - upityness};

    this.ctx.beginPath();
    this.ctx.moveTo(startPoint["x"], startPoint["y"]);
    this.ctx.bezierCurveTo(cp1["x"], cp1["y"], cp2["x"], cp2["y"],  endPoint["x"], endPoint["y"]);
    //this.ctx.strokeStyle = "blue";
    this.ctx.stroke();

    let showControlPoints:boolean;
    showControlPoints = true;
    if(showControlPoints) {
      //mark the control points:
      this.ctx.beginPath();
      this.ctx.arc(cp1["x"], cp1["y"], 2, 0, 2 * Math.PI); 
      this.ctx.strokeStyle = "green";
      this.ctx.stroke();
      //2nd Cp
      this.ctx.beginPath();
      this.ctx.arc(cp2["x"], cp2["y"], 2, 0, 2 * Math.PI); 
      this.ctx.strokeStyle = "blue";
      this.ctx.stroke();
    }
    

  }

  clearCanvas()
  {
    this.ctx.clearRect(0, 0, this.ctx.width, this.ctx.height); // ???
    
  }

  getGoogleSyntax() {
    this.clearCanvas();
    this.syntaxEntryArray = [];

    let ApiKey:string = "PLACE YOUR Google Cloud API key here"; 
    console.log(this.jsonObject); //We should have the sample response - added from constructor

    if(this.userInput.length < 2) return;
      let requestBody:any = {"encodingType": "UTF8", "document": {"language": "en", "type": "PLAIN_TEXT", "content": this.userInput}};
      let obj:any = {};

      //UNCOMMENT THE FOLLOWING API call WHEN YOU HAVE YOUR OWN KEY
      //this.obs = this.httpClient.post('https://language.googleapis.com/v1/documents:analyzeSyntax?key=' + ApiKey, requestBody);
      // this.obs
      //.subscribe(data => {  
      //this.result = JSON.stringify(data);

        //let sentArray:any[] = data.sentences;
        //let tokenArray:any[] = data.tokens;
        let sentArray:any[] = this.jsonObject.sentences;
        let tokenArray:any[] = this.jsonObject.tokens;

        let syntaxEntry:SyntaxEntry;
        for(var j = 0; j < tokenArray.length; j++){
          syntaxEntry =  new SyntaxEntry();
          syntaxEntry.allKnownOthersCoalesce = [];
          syntaxEntry.OriginalWord = tokenArray[j].text["content"];
          syntaxEntry.lemmaText = tokenArray[j].lemma.toString();
          if(syntaxEntry.lemmaText == syntaxEntry.OriginalWord) syntaxEntry.lemmaTextCoalesce = "";
          else syntaxEntry.lemmaTextCoalesce = syntaxEntry.lemmaText;
          syntaxEntry.partOfSpeech = tokenArray[j].partOfSpeech;//object
          syntaxEntry.pos = syntaxEntry.partOfSpeech["tag"];
          
          syntaxEntry.case = syntaxEntry.partOfSpeech["case"];
          syntaxEntry.person = syntaxEntry.partOfSpeech["person"];
          syntaxEntry.voice = syntaxEntry.partOfSpeech["voice"];
          syntaxEntry.mood = syntaxEntry.partOfSpeech["mood"];
          syntaxEntry.tense = syntaxEntry.partOfSpeech["tense"];
          syntaxEntry.aspect = syntaxEntry.partOfSpeech["aspect"];
          syntaxEntry.gender = syntaxEntry.partOfSpeech["gender"];
          syntaxEntry.number = syntaxEntry.partOfSpeech["number"];
          syntaxEntry.proper = syntaxEntry.partOfSpeech["proper"];
          
          syntaxEntry.dependencyEdge = tokenArray[j].dependencyEdge;
          syntaxEntry.dEheadTokenIndex = tokenArray[j].dependencyEdge["headTokenIndex"];
          syntaxEntry.dElabel = tokenArray[j].dependencyEdge["label"].toLowerCase();

          syntaxEntry.reciprocity = syntaxEntry.partOfSpeech["reciprocity"];
          syntaxEntry.proper = syntaxEntry.partOfSpeech["proper"];

          if(syntaxEntry.mood != "MOOD_UNKNOWN") syntaxEntry.allKnownOthersCoalesce.push("mood=" + syntaxEntry.mood);
          if(syntaxEntry.case != "CASE_UNKNOWN") syntaxEntry.allKnownOthersCoalesce.push("case=" + syntaxEntry.case);
          if(syntaxEntry.number != "NUMBER_UNKNOWN") syntaxEntry.allKnownOthersCoalesce.push("number=" + syntaxEntry.number);
          if(syntaxEntry.person != "PERSON_UNKNOWN") syntaxEntry.allKnownOthersCoalesce.push("person=" + syntaxEntry.person);
          if(syntaxEntry.voice != "VOICE_UNKNOWN") syntaxEntry.allKnownOthersCoalesce.push("voice=" + syntaxEntry.voice);
          if(syntaxEntry.tense != "TENSE_UNKNOWN") syntaxEntry.allKnownOthersCoalesce.push("tense=" + syntaxEntry.tense);
          if(syntaxEntry.aspect != "ASPECT_UNKNOWN") syntaxEntry.allKnownOthersCoalesce.push("aspect=" + syntaxEntry.aspect);
          if(syntaxEntry.gender != "GENDER_UNKNOWN") syntaxEntry.allKnownOthersCoalesce.push("gender=" + syntaxEntry.gender);
          if(syntaxEntry.reciprocity != "RECIPROCITY_UNKNOWN") syntaxEntry.allKnownOthersCoalesce.push("reciprocity=" + syntaxEntry.reciprocity);
          if(syntaxEntry.proper != "PROPER_UNKNOWN") syntaxEntry.allKnownOthersCoalesce.push("proper=" + syntaxEntry.proper);

          this.syntaxEntryArray.push(syntaxEntry);

        }
        console.log(this.syntaxEntryArray);
        this.canvasWidth = 150*this.syntaxEntryArray.length;
        this.drawVisualTree();
  
      //ALSO UNCOMMENT THE FOLLOWING ENDING to the subscribe observable
      //},
      //error => alert('Error in subscribe of syntax call: ' + error.message) ) 

  } //end getGoogleSyntax

  clearAll(){
    this.userInput = "";
    this.result = "";
    this.syntaxEntryArray = [];
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  }

  loadJsonSampleResponse()
  {
    this.jsonObject = { 
      "sentences": [
      {
        "text": {
          "content": "I came to this place, and she did too.",
          "beginOffset": 0
        }
      }
    ],
    "tokens": [
      {
        "text": {
          "content": "I",
          "beginOffset": 0
        },
        "partOfSpeech": {
          "tag": "PRON",
          "aspect": "ASPECT_UNKNOWN",
          "case": "NOMINATIVE",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "SINGULAR",
          "person": "FIRST",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 1,
          "label": "NSUBJ"
        },
        "lemma": "I"
      },
      {
        "text": {
          "content": "came",
          "beginOffset": 2
        },
        "partOfSpeech": {
          "tag": "VERB",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "INDICATIVE",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "PAST",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 1,
          "label": "ROOT"
        },
        "lemma": "come"
      },
      {
        "text": {
          "content": "to",
          "beginOffset": 7
        },
        "partOfSpeech": {
          "tag": "ADP",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 1,
          "label": "PREP"
        },
        "lemma": "to"
      },
      {
        "text": {
          "content": "this",
          "beginOffset": 10
        },
        "partOfSpeech": {
          "tag": "DET",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "SINGULAR",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 4,
          "label": "DET"
        },
        "lemma": "this"
      },
      {
        "text": {
          "content": "place",
          "beginOffset": 15
        },
        "partOfSpeech": {
          "tag": "NOUN",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "SINGULAR",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 2,
          "label": "POBJ"
        },
        "lemma": "place"
      },
      {
        "text": {
          "content": ",",
          "beginOffset": 20
        },
        "partOfSpeech": {
          "tag": "PUNCT",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 1,
          "label": "P"
        },
        "lemma": ","
      },
      {
        "text": {
          "content": "and",
          "beginOffset": 22
        },
        "partOfSpeech": {
          "tag": "CONJ",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 1,
          "label": "CC"
        },
        "lemma": "and"
      },
      {
        "text": {
          "content": "she",
          "beginOffset": 26
        },
        "partOfSpeech": {
          "tag": "PRON",
          "aspect": "ASPECT_UNKNOWN",
          "case": "NOMINATIVE",
          "form": "FORM_UNKNOWN",
          "gender": "FEMININE",
          "mood": "MOOD_UNKNOWN",
          "number": "SINGULAR",
          "person": "THIRD",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 8,
          "label": "NSUBJ"
        },
        "lemma": "she"
      },
      {
        "text": {
          "content": "did",
          "beginOffset": 30
        },
        "partOfSpeech": {
          "tag": "VERB",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "INDICATIVE",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "PAST",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 1,
          "label": "CONJ"
        },
        "lemma": "do"
      },
      {
        "text": {
          "content": "too",
          "beginOffset": 34
        },
        "partOfSpeech": {
          "tag": "ADV",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 8,
          "label": "ADVMOD"
        },
        "lemma": "too"
      },
      {
        "text": {
          "content": ".",
          "beginOffset": 37
        },
        "partOfSpeech": {
          "tag": "PUNCT",
          "aspect": "ASPECT_UNKNOWN",
          "case": "CASE_UNKNOWN",
          "form": "FORM_UNKNOWN",
          "gender": "GENDER_UNKNOWN",
          "mood": "MOOD_UNKNOWN",
          "number": "NUMBER_UNKNOWN",
          "person": "PERSON_UNKNOWN",
          "proper": "PROPER_UNKNOWN",
          "reciprocity": "RECIPROCITY_UNKNOWN",
          "tense": "TENSE_UNKNOWN",
          "voice": "VOICE_UNKNOWN"
        },
        "dependencyEdge": {
          "headTokenIndex": 1,
          "label": "P"
        },
        "lemma": "."
      }
    ],
    "language": "en"};

  }


} //end class

class point {
  x:number;
  y:number;
}

class partOfSpeechAttribs {
  index:number; //order in +y display order`
  name:string; //eg., mood, case
  value:string; // may have '_UNKNOWN'

}
