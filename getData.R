setwd('/Users/mathewbrown/fun/shotDiff')

library(nhlscrapr)
library(ggplot2)
library(dplyr)


#Give me a single game record. gcode starts at 20001 each seasoon

for(i in 20001:20221){
  print(i)
}
sample.game <- retrieve.game (season="20172018", gcode="20001")

game <- sample.game[["playbyplay"]]
game <- dplyr::tbl_df(game)

#Produce a cumulate shots plot
# cumsum(subset(game$etype, etype %in% "SHOT"))

#just get the shot events
shots <- dplyr::filter(game, etype%in% "SHOT" | etype%in% "GOAL")
head(shots)

# shots %>% distinct(ev.team)
shots$hometeam[1]

#get shotdiff
shotscum <- shots %>% dplyr::mutate(shotdff= cumsum(ev.team == shots$hometeam[1])-cumsum(ev.team == shots$awayteam[1]))

outdata <- dplyr::select(shotscum,seconds,etype,shotdff,awayteam, hometeam,ev.team)
write.csv(outdata,file=)

ggplot(shotscum,
       aes(y = shotdff, x = seconds,color=ev.team)) +
  geom_point() +
  geom_point(data = shotscum, aes(color = etype%in% "GOAL"))


#some plots
#filter for shots
ggplot(subset(game, etype %in% "GOAL"),
       aes(x=seconds,
           y=ev.team,
           color=ev.team))+
  geom_point()
