#!/bin/sh

#___Sons Generiques
volume=$(cat /sys/class/gpio/gpio13/value)
if [ $volume -eq 0 ]
then
	volume=-400 #-450
else
	volume=400 #350
fi

#___Allumage ou non des leds
if [ $2 = "noLeds" ]
then
	echo $2
else
	#sudo node /home/pi/odi/core/modules/allLedsOn.js
	sudo node /home/pi/odi/core/modules/leds.js allLedsOn
fi

echo $1

#___Son Demarrage Odi Raspi
if [ $1 = "startup" ]
then
	#sound="/home/pi/odi/media/mp3/system/bonjour.mp3"
	sound="/home/pi/odi/media/mp3/system/bonjourSurvivaure.mp3"
#___Son restart Odi Program
elif [ $1 = "odi" ]
then
	sudo omxplayer -o local --vol $volume /home/pi/odi/media/mp3/system/startupOdi.mp3
#___Son restart Odi Program
elif [ $1 = "error" ]
then
	sudo omxplayer -o local --vol $volume /home/pi/odi/media/mp3/system/error.mp3
#___Son "Bonjour Bonjour !""
elif [ $1 = "bonjourBonjour" ]
then
	sound="/home/pi/odi/media/mp3/system/bonjourBonjour.mp3"
#___Son Redemarrage Odi
elif [ $1 = "reboot" ]
then
	sound="/home/pi/odi/media/mp3/system/beBack.mp3"
#___Son Arret Odi
elif [ $1 = "shutdown" ]
then
	sound="/home/pi/odi/media/mp3/system/sessionOff.mp3"
elif [ $1 = "tone" ]
then
	sound="/home/pi/odi/media/mp3/system/tone.mp3"
elif [ $1 = "cocorico" ]
then
	sound="/home/pi/odi/media/mp3/system/cocorico.mp3"
#___Son UI
elif [ $1 = "UI" ]
then
	# sound="/home/pi/odi/media/mp3/system/sonarUI.mp3"
	sound="/home/pi/odi/media/mp3/system/UIsound1.mp3"
#___Son Cigales
elif [ $1 = "cigales" ]
then
	sound="/home/pi/odi/media/mp3/system/cigales.mp3"
#___Son Annif
elif [ $1 = "birthday" ]
then
	sound="/home/pi/odi/media/mp3/system/birthday.mp3"
#___Son Mer du matin
elif [ $1 = "MorningSea" ]
then
	sound="/home/pi/odi/media/mp3/system/morningSea.mp3"
#___Son oiseaux du matin
elif [ $1 = "MorningBirds" ]
then
	sound="/home/pi/odi/media/mp3/system/morningBirds.mp3"
#___Chanson Il est 13H et tout va bien
elif [ $1 = "13Heures" ]
then
	sound="/home/pi/odi/media/mp3/exclamation/fr_ben_voyons#1.mp3"
#___Son Test
elif [ $1 = "test" ]
then
	sound="/home/pi/odi/media/mp3/system/error.mp3"
	# sound="/home/pi/odi/media/mp3/system/DescenteInfinie.mp3"
#___Donjon de Naheulbeuk
elif [ $1 = "Naheulbeuk" ]
then
	sound="/home/pi/odi/media/mp3/stories/Donjon-De-Naheulbeuk-Integrale.mp3"
#___Aventuriers du Survivaure
elif [ $1 = "Survivaure" ]
then
	sound="/home/pi/odi/media/mp3/stories/Aventuriers-Du-Survivaure-Integrale.mp3"
elif [ $1 = "new" ]
#___Son Test derniere maj
then
	sound="/home/pi/odi/media/mp3/exclamation/jusquIciToutVaBienLaHaine.mp3"
#___Son par defaut : ressort
else
	sound="/home/pi/odi/media/mp3/exclamation/ressort.mp3"
fi

#___Naheulbeuk || Survivaure
if [ $1 = "Naheulbeuk" ] || [ $1 = "Survivaure" ]
then
	echo "STORIES: Donjon-De-Naheulbeuk-Integrale || Aventuriers-Du-Survivaure-Integrale"
	position=$(shuf -i 0-20000 -n 1)
	sudo killall omxplayer.bin
	#sudo node /home/pi/odi/core/modules/allLedsOff.js
	sudo node /home/pi/odi/core/modules/leds.js allLedsOff
	sudo omxplayer -o local --pos $position --vol $volume $sound > /dev/null &

else
	sudo omxplayer -o local --vol $volume $sound
	#sudo node /home/pi/odi/core/modules/allLedsOff.js
	
	#___Extinction ou non des leds
	if [ $2 = "noLeds" ]
	then
		echo $2
	else
		sudo node /home/pi/odi/core/modules/leds.js allLedsOff
	fi
	#sudo node /home/pi/odi/core/modules/leds.js allLedsOff
fi