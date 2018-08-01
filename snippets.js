// incoming MQTT message on button press gets stored in global variable
if (msg.payload > 2) {msg.payload = msg.payload % 3}
global.set("count",msg.payload);

// incoming MQTT message on switch move gets stored in global variable
global.set("switched",msg.payload);

// rad to deg
msg.payload = Math.round(Number(msg.payload)*180/3.14159265359)

// m/s to knots
msg.payload = Math.round(Number(msg.payload)*19.4384)

// filter, offset and pass atmospheric pressure
msg = { payload: String(msg.payload.pressure) };
var originalval = msg.payload*100;
msg.payload = (parseFloat(originalval).toFixed(1) - 1625)/100;
return msg;

// from several incoming sensor data, only one gets forwarded to the LED display
var getcount = global.get("count");
var getswitched = global.get("switched");
msg.speed = "5";
if (msg.sensor == "temp" && getcount === 0 && getswitched % 2 !== 0) {
    msg.payload = "R90\n"+Math.round(Number(msg.payload));
    msg.color = "red";
 return msg;
}else if (msg.sensor == "press" && getcount === 1 && getswitched % 2 !== 0) {
    msg.payload = "R90\n"+msg.payload;
    msg.color = "white";
 return msg;
}else if (msg.sensor == "course" && getcount === 2 && getswitched % 2 !== 0) {
    msg.payload = Math.round(Number(msg.payload));
    msg.payload = "R90\n"+msg.payload;
    msg.color = "magenta";
 return msg;
}else if (msg.sensor == "temp" && getcount === 0 && getswitched % 2 === 0) {
    msg.payload = "R90\n"+Math.round(Number(msg.payload));
    msg.color = "red";
 return msg;
}else if (msg.sensor == "appwind" && getcount === 1 && getswitched % 2 === 0) {
    msg.payload = "R90\n"+msg.payload/10;
    msg.color = "aquamarine";
 return msg;
}else if (msg.sensor == "log" && getcount === 2  && getswitched % 2 === 0) {
    msg.payload = "R90\n"+msg.payload/10;
    msg.color = "blue";
 return msg;
}else return null;
