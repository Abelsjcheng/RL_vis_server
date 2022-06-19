#!/bin/bash

relation=$1
python train_policy_supervised_learning.py $relation
python train_policy_reinforcement_learning.py $relation retrain
python train_policy_reinforcement_learning.py $relation test

# python train_policy_supervised_learning.py concept_athleteplaysinleague
# python train_policy_reinforcement_learning.py concept_athleteplaysinleague retrain
# python train_policy_reinforcement_learning.py concept_athleteplaysinleague test

# ./link_prediction_eval.sh concept_athleteplaysinleague

# ./pathfinder.sh concept_athleteplaysinleague

# python fact_prediction_eval.py concept_athleteplaysinleague
# python fact_prediction_eval.py concept_athletehomestadium
# python fact_prediction_eval.py concept_athleteplaysforteam
# python fact_prediction_eval.py concept_athleteplayssport
#python fact_prediction_eval.py concept_agentbelongstoorganization
#python fact_prediction_eval.py concept_organizationheadquarteredincity
#python fact_prediction_eval.py concept_organizationhiredperson
#python fact_prediction_eval.py concept_personborninlocation
#python fact_prediction_eval.py concept_personleadsorganization
#python fact_prediction_eval.py concept_teamplaysinleague
#python fact_prediction_eval.py concept_teamplayssport
#python fact_prediction_eval.py concept_worksfor



