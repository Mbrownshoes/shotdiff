setwd('/Users/mathewbrown/fun/shotDiff')

library(nhlscrapr)
library(ggplot2)
library(plyr); library(dplyr)
library(jsonlite)

#Give me a single game record. gcode starts at 20001 each seasoon

j = 0
gamelist =list()
gameinfo = list()
for(i in 20380:20408){
  j=j+1
  sample.game <- NULL
  print(i)
  sample.game <- retrieve.game(season="20172018", gcode=i)
  game <- sample.game[["playbyplay"]]
  #just get the shot and goals 
  shots <- dplyr::filter(game, etype%in% "SHOT" | etype%in% "GOAL")
  #get shot differential
  shotscum <- shots %>% dplyr::mutate(shotdff= cumsum(ev.team == shots$hometeam[1])-cumsum(ev.team == shots$awayteam[1]))
  gcode<-unlist(shotscum["gcode"][1,1], use.names = FALSE)
  outdata <- dplyr::select(shotscum,seconds,etype,shotdff,ev.team,gcode)
  gamelist[[j]] <- outdata
  
  # make dataframe of game info
  date <- c(paste0(sample.game$date[2],',',sample.game$date[3],',',sample.game$date[4]))
  scorehome <- sample.game$score[1]
  scoreaway <- sample.game$score[2]
  away <- sample.game$teams[1]
  home <- sample.game$teams[2]
  df<-data.frame(date,home,away,scorehome,scoreaway,gcode,nrow(outdata))
  rownames(df) <- NULL
  gameinfo[[j]] <- df
  
}
# load all existing games
all <- readRDS(file="allGames.rds")
allinfo <- readRDS(file="allGamesInfo.rds")

#bind all months
y <- rbind.fill(gameinfo)
y1 <- rbind.fill(allinfo)
y$gcode= as.numeric(y$gcode)
y1$gcode= as.numeric(y1$gcode)
y3<-dplyr::full_join(y, y1)
y3<-dplyr::arrange(y3, gcode)
#bind all months
x <- rbind.fill(gamelist)
x1 <- rbind.fill(all)

x$gcode= as.numeric(x$gcode)
x1$gcode= as.numeric(x1$gcode)
x2=dplyr::full_join(x, x1)
x2<-dplyr::arrange(x2, gcode)
#remove duplicat games (rows)
x2 = distinct(x2)
y3 = distinct(y3)

write.csv(x2,file='allgames.csv')
write.csv(y3,file='allgamesinfo.csv')

saveRDS(x2, file="allGames.rds")
saveRDS(y3, file="allGamesInfo.rds")

## should be it!


#bind all months
y <- rbind.fill(gameinfo1)
y1 <- rbind.fill(gameinfo2)
y$gcode= as.numeric(y$gcode)
y1$gcode= as.numeric(y1$gcode)
y3<-dplyr::full_join(y, y1)

#bind all months
x <- rbind.fill(gamelist1)
x1 <- rbind.fill(gamelist2)

x$gcode= as.numeric(x$gcode)
x1$gcode= as.numeric(x1$gcode)

x2=dplyr::full_join(x, x1)


inf <- rbind.fill(gameinfo)
colnames(y3)[7] <-'shots'
saveRDS(inf, file="allGamesInfo.rds")
write.csv(x2,file='allgames.csv')
write.csv(y3,file='allgamesinfo.csv')

sample.game <- retrieve.game(season="20172018", gcode="20014")

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

outdata <- dplyr::select(shotscum,seconds,etype,shotdff,awayteam, hometeam,ev.team,gcode)

season<-unlist(shotscum["season"][1,1], use.names = FALSE)
gcode<-unlist(shotscum["gcode"][1,1], use.names = FALSE)

write.csv(outdata,file=paste0(season,'_',gcode,".csv"))


# make dataframe of game info
date <- c(paste0(sample.game$date[2],',',sample.game$date[3],',',sample.game$date[4]))
scorehome <- sample.game$score[1]
scoreaway <- sample.game$score[2]
df<-data.frame(date,scorehome,scoreaway)
rownames(df) <- NULL
write.csv(df,file=paste0(season,'_',gcode,"_info",".csv"))
# outJson=jsonlite::toJSON(outdata)
# cat(outJson,file='game.json')

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
