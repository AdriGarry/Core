#!/bin/sh

#___Video
echo "Video script started: " $*
# SERVICE="omxplayer" # On definit le service a utiliser (omxplayer)


if [ $1 = "sleep" ] # Switch screen off
then
	sudo /opt/vc/bin/tvservice -o

else # Switch screen on
	sudo /opt/vc/bin/tvservice -p

	if [ $1 = "morning" ] # Test video
	then
		while true; do # On scanne en boucle le dossier
			video=$(sudo find /home/pi/odi/media/video/morning -maxdepth 1 -type f | shuf | head -1)
			sudo omxplayer -o hdmi --vol 0 --blank --win '0 0 1680 1050' $video
		done

	elif [ $1 = "test" ] # Test video
	then
		sudo omxplayer -o hdmi --vol 0 --blank --win '0 0 1680 1050' /home/pi/odi/media/video/test1.mp4

	elif [ $1 = "random" ] # Default: random video
	then
		while true; do # On scanne en boucle le dossier
			video=$(sudo find /home/pi/odi/media/video/rdm -maxdepth 1 -type f | shuf | head -1)
			playTimeDecimal=$(mplayer -identify -ao null -vo null -frames 0 $video | grep ^ID_LENGTH= | cut -d = -f 2)
			# echo "playTimeDecimal" $playTimeDecimal
			playTime=${playTimeDecimal%.*}
			echo "playTime" $playTime

			sudo omxplayer -o hdmi --vol 0 --blank --win '0 0 1680 1050' $video &
			sleep $playTime
		done
	fi
fi